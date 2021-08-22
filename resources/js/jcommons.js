// *** J-Commons (jC) Library ***

(function(window, $, undefined) {

// *** jC ***

	var jC = {
		// *** Utilities ***

		topUsableWindow: (function() {
			var topW = window;
			while (topW.parent != topW.self) {
				try {
					var document = topW.parent.document; // Test
					topW = topW.parent;
				} catch(e) {
					return topW.self;
				}
			}
			return topW.self;
		})(),

		$: function(v) {
			return (v instanceof $) ? v : $(v);
		},

		contained$: function(v, $container, includeContainer) {
			if ($container) {
				var $elements = jC.$($container).find(v);
				return includeContainer ? $elements.addBack() : $elements;
			}
			return jC.$(v);
		},

		id$: function(id) {
			return $(jC.idSelector(id));
		},

		IGNORE_EXCEPTION: function(/*e*/) {},

		escapeId: function(id) {
			return id.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
		},

		idSelector: function(id) {
			return '#' + jC.escapeId(id);
		},

		includeJsFile: function(src, params) {
			document.write('<script src="' + jC.escapeXml(jC.url.addParams(src, params))
					+ '" type="text/javascript"></script>');
		},

		transform: function(obj, transformer) {
			if (transformer) {
				if ($.isArray(transformer)) {
					var result = obj;
					$.each(transformer, function() { result = jC.transform(result, this); });
					return result;
				} else {
					return transformer.call(null, obj);
				}
			}
			return obj;
		},

		// *** Null & Undefined ***

		undefined: function() {
			return undefined;
		},

		defaultFalse: function(/* 0..N booleans */) {
			var args = $.makeArray(arguments);
			args.push(false);
			return jC.defaultIfNullOrUndefined.apply(this, args);
		},

		defaultIfNullOrUndefined: function(/* 1..N values, the last is the default */) {
			var args = $.makeArray(arguments);
			var result = args.pop();
			$.each(args, function(i, v) { // Do not use "this".
				if (!jC.isNullOrUndefined(v)) {
					result = v;
					return false;
				}
				return true;
			});
			return result;
		},

		defaultIfUndefined: function(/* 1..N values, the last is the default */) {
			var args = $.makeArray(arguments);
			var result = args.pop();
			$.each(args, function(i, v) { // Do not use "this".
				if (!jC.isUndefined(v)) {
					result = v;
					return false;
				}
				return true;
			});
			return result;
		},

		defaultTrue: function(/* 0..N booleans */) {
			var args = $.makeArray(arguments);
			args.push(true);
			return jC.defaultIfNullOrUndefined.apply(this, args);
		},

		isNullOrUndefined: function(v) {
			return (v == null);
		},

		isUndefined: function(v) {
			return (v === undefined);
		},

		// *** classes ***

		ABSTRACT_METHOD: function() {
			throw new Error('Abstract method');
		},

		createClass: function(baseConstructor, constructor, members) {
			if ($.isFunction(constructor)) {
				if (Object.create) {
					constructor.prototype = Object.create(baseConstructor.prototype);
				} else {
					function Dummy() {}
					Dummy.prototype = baseConstructor.prototype;
					constructor.prototype = new Dummy();
				}
				constructor.prototype.constructor = constructor;
			} else {
				members = constructor;
				constructor = baseConstructor;
			}
			if (members) { $.extend(constructor.prototype, members); }
			return constructor;
		},

		createInterface: function(members) {
			return jC.createClass(function() {}, members);
		},

		// *** Copy ***

		shallowCopy: function(obj) {
			return $.extend(($.isArray(obj) ? []: {}), obj);
		},

		deepCopy: function(obj) {
			return $.extend(true, ($.isArray(obj) ? []: {}), obj);
		},

		// *** Iterator Functions ***
		// TODO - namespace?

		collect: function(collection, callback) {
			var result = [];
			$.each(collection, function(i, v) {
				result.push(callback.call(this, i, v));
			});
			return result;
		},

		collectProperty: function(collection, name) {
			return jC.collect(collection, function(i, v) {
				return (v[name]);
			});
		},

		find: function(collection, callback) {
			var result;
			$.each(collection, function(i, v) {
				if (callback.call(this, i, v)) {
					result = v;
					return false;
				}
				return true;
			});
			return result;
		},

		findByProperty: function(collection, name, value) {
			return jC.find(collection, function(i, v) {
				return (v[name] === value);
			});
		},

		findIndex: function(collection, callback) {
			var result = -1;
			$.each(collection, function(i, v) {
				if (callback.call(this, i, v)) {
					result = i;
					return false;
				}
				return true;
			});
			return result;
		}
	};

// *** jC.CumulativeCommand ***

	jC.CumulativeCommand = function(executeCallback, undoCallback) {
		this.executeCallback = executeCallback;
		this.undoCallback = undoCallback;
		this._counter = 0;
	};

	$.extend(jC.CumulativeCommand.prototype, {
		execute: function() {
			if (this._counter == 0) {
				jC.callback.call(this.executeCallback, this);
			}
			this._counter++;
		},

		undo: function() {
			this._counter--;
			if (this._counter == 0) {
				jC.callback.call(this.undoCallback, this);
			}
		}
	});

// *** jC.Debouncer ***

	jC.Debouncer = function(callback /* optional */, delay /* optional */) {
		if (!$.isFunction(callback)) {
			delay = callback;
			callback = null;
		}

		this.callback = callback;
		this.delay = delay;

		this.timer = null;
	};

	$.extend(jC.Debouncer.prototype, {
		debounce: function(callback /* optional */, delay /* optional */) {
			if (!$.isFunction(callback)) {
				delay = callback;
				callback = null;
			}

			callback = jC.defaultIfNullOrUndefined(callback, this.callback);
			delay = jC.defaultIfNullOrUndefined(delay, this.delay, 0);

			clearTimeout(this.timer);
			this.timer = null;

			if (callback) {
				this.timer = setTimeout(function() { callback.call(); }, delay);
			}
		},

		callNow: function(callback) {
			if (callback) {
				this.debounce(callback, 0);
			} else {
				this.debounce(0);
			}
		}
	});

// *** jC.support ***

	jC.support = {
		HISTORY_STATE: !!history.replaceState,

		PLACEHOLDER: 'placeholder' in document.createElement('input')
	};

// *** jC.history ***

	jC.history = {
		extendState: function(data) {
			if (jC.support.HISTORY_STATE) {
				history.replaceState($.extend({}, history.state, data), '');
				return true;
			}
			return false;
		}
	};

// *** jC.autocompleteOff ***

	jC.autocompleteOff = {
		instrument: function() {
			if (jC.support.HISTORY_STATE) {
				jC.autocompleteOff.restoreValues();
				$(window).on('unload', function() {
					jC.autocompleteOff.recordValues();
				});
			}
		},

		recordValues: function() {
			if (jC.support.HISTORY_STATE) {
				var map = {};
				$('input:text[autocomplete=off][id]').each(function() {
					var $input = $(this);
					map[$input.attr('id')] = $input.val();
				});
				jC.history.extendState({ inputValueMap: map });
			}
		},

		restoreValues: function() {
			if (jC.support.HISTORY_STATE) {
				if (history.state && history.state.inputValueMap) {
					$.each(history.state.inputValueMap, function(id, value) {
						jC.id$(id).val(value);
					});
				}
			}
		}
	};

// *** jC.autoInstrument ***

	jC.autoInstrument = function($container, includeContainer) {
		jC.autoInstrument._do($container, includeContainer);
	};

	$.extend(jC.autoInstrument, {
		_do: function($container, includeContainer) {} // Hook.
	});

// *** jC.dom ***

	jC.dom = {
		getNodeContent: function(node) {
			var content = '';
			if (node) {
				$.each(node.childNodes, function(index, node) {
					if (node.data) { content += node.data; }
				});
			}
			return content;
		}
	};

// *** jC.window ***

	jC.window = {
		isTargetSelf: function(target) {
			return !target || (target == '_self')
					|| ((target == '_parent') && (window.parent == window.self))
					|| ((target == '_top') && (window.top == window.self))
					|| (target == window.name);
		},

		openPage: function(url, options) {
			options = options || {};
			if (jC.window.isTargetSelf(options.target)) {
				window.location.href = url;
			} else {
				window.open(url, options.target);
			}
		}
	};

// *** jC.document ***

	jC.document = {
		scrollPos: function() {
			var $document = $(document);
			return { left: $document.scrollLeft(), top: $document.scrollTop() };
		},

		hideVerticalScrollbarCommand: new jC.CumulativeCommand(function() {
			$(document.body).css({
				overflow: 'hidden',
				paddingRight: 17
			})
		}, function() {
			$(document.body).css({
				overflow: 'scroll',
				paddingRight: 0
			});
		})
	};

// *** jC.viewport ***

	jC.viewport = {
		offsetOf: function($element) {
			var offset = jC.$($element).offset(),
				$window = $(window),
				vpOffset = { left: offset.left - $window.scrollLeft(), top: offset.top - $window.scrollTop() };
			return {
				left: vpOffset.left,
				top: vpOffset.top,
				right: $window.width() - $element.outerWidth() - vpOffset.left,
				bottom: $window.height() - $element.outerHeight() - vpOffset.top
			};
		},

		offset: function() {
			var $window = $(window);
			return { left: $window.scrollLeft(), top: $window.scrollTop() };
		},

		size: function() {
			var $window = $(window);
			return { width: $window.width(), height: $window.height() };
		}
	};

// *** jC.object ***

	jC.object = {
		getFlat: (function() {
			function flattenArray(obj, rootName, nestedArray) {
				$.each(nestedArray, function(index, value) {
					var nestedName = rootName + '[' + index + ']';
					if ($.isPlainObject(value)) {
						flattenObject(obj, nestedName, value);
					} else if ($.isArray(value)) {
						flattenArray(obj, nestedName, value);
					} else {
						obj[nestedName] = value;
					}
				});
			}

			function flattenObject(obj, rootName, nestedObj, flattenArrays) {
				flattenArrays = jC.defaultFalse(flattenArrays);
				$.each(nestedObj, function(name, value) {
					var nestedName = (rootName ? (rootName + '.') : '') + name;
					if ($.isPlainObject(value)) {
						flattenObject(obj, nestedName, value);
					} else if ($.isArray(value)) {
						flattenArray(obj, nestedName, value);
					} else {
						obj[nestedName] = value;
					}
				});
			}

			return function(nestedObj, flattenArrays) {
				var result = {};
				flattenObject(result, null, nestedObj, flattenArrays);
				return result;
			}
		})(),

		getNested: function(flatObj) {
			var result = {};
			$.each(flatObj, function(nestedName, value) {
				var names = nestedName.split('.');
				if (names.length > 0) {
					var lastName = names.pop(),
							obj = result;
					$.each(names, function(i, name) {
						if (!obj[name]) { obj[name] = {}; }
						obj = obj[name];
					});
					obj[lastName] = value;
				}
			});
			return result;
		},

		stringCompare: function(obj1, obj2) {
			return jC.string.compare(jC.object.toNonNullString(obj1), jC.object.toNonNullString(obj2));
		},

		stringCompareIgnoreCase: function(obj1, obj2) {
			return jC.string.compareIgnoreCase(jC.object.toNonNullString(obj1), jC.object.toNonNullString(obj2));
		},

		getProperty: function(obj, nestedProperty) {
			var result = obj;
			if (result && nestedProperty) {
				$.each($.isArray(nestedProperty) ? nestedProperty : nestedProperty.split('.'), function() {
					result = result[this];
					return !jC.isNullOrUndefined(result)
				});
			}
			return result;
		},

		toNonNullString: function(obj) {
			return obj ? obj.toString() : '';
		}
	};

// *** jC.array ***

	jC.array = {
		contains: function(a, v) {
			return ($.inArray(v, a) >= 0);
		},

		containsAll: function(a, av) {
			var result = true;
			if (av) {
				$.each(av, function(i, v) {
					if (a && ($.inArray(v, a) < 0)) {
						result = false;
						return false;
					}
					return true;
				});
			}
			return result;
		},

		indexOf: function(a, value) {
			if ($.isFunction(value)) {
				for (var i = 0, len = a.length; i < len; i++) {
					if (value.call(this, a[i])) {
						return i;
					}
				}
				return -1;
			} else {
				return jC.array.indexOf(a, function(v) { return v === value});
			}
		},

		indexOfByProperty: function(a, name, value) {
			return jC.array.indexOf(a, function(v) { return v[name] === value});
		},

		moveToFront: function(a, index) {
			var element = a[index];
			for (var i = index; i > 0; i--) {
				a[i] = a[i-1];
			}
			a[0] = element;
		},

		remove: function(a, value) {
			var count = 0,
				i = 0;
			while ((i = a.indexOf(value, i)) >= 0) {
				a.splice(i, 1);
				count++;
			}
			return count;
		},

		removeAt: function(a, index) {
			if (index >= 0) {
				return a.splice(index, 1)[0];
			}
			return undefined;
		},

		removeFirst: function(a, name, value) {
			return jC.array.removeAt(jC.array.indexOf(a, name, value));
		},

		removeFirstByProperty: function(a, name, value) {
			return jC.array.removeAt(a, jC.array.indexOfByProperty(a, name, value));
		},

		setLength: function(a, len, def) {
			if (a.length > len) {
				a.length = len;
			} else {
				while (a.length < len) {
					a.push(def);
				}
			}
		},

		indexMap: function(a) {
			var map = {};
			$.each(a, function(i, v) {
				map[v] = i;
			});
			return map;
		}
	};

// *** jC.callback ***

	jC.callback = {
		call: function(/* callback, context, 0..N args */) {
			var args = Array.prototype.slice.call(arguments),
					callback = args.shift();
			if (callback) {
				var context = args.shift();
				return callback.apply(context, args);
			}
			return undefined;
		},

		chain: function(/* 0..1 stopOnFalse, 0..N callbacks */) {
			var callbacks =  $.makeArray(arguments);
			var stopOnFalse = (typeof callbacks[0] === 'boolean') ? callbacks.shift() : false;
			return function() {
				var callbackArguments = arguments;
				var result;
				$.each(callbacks, $.proxy(function(i, callback) {
					if (callback) {
						result = callback.apply(this, callbackArguments);
						return stopOnFalse ? result : true;
					}
					return true;
				}, this));
				return result;
			};
		},

		conditional: function(condition, callback, defaultValue) {
			return function() {
				return condition.call(this) ? callback.apply(this, arguments) : defaultValue;
			};
		}
	};

// *** jC.string ***

	jC.string = {
		compare: function(str1, str2) {
			str1 = str1 || '';
			str2 = str2 || '';
			return (str1 > str2) ? 1 : ((str1 < str2) ? -1 : 0);
		},

		compareIgnoreCase: function(str1, str2) {
			str1 = str1 || '';
			str2 = str2 || '';
			return jC.string.compare(str1.toLowerCase(), str2.toLowerCase());
		},

		countLeadingChars: function(str, ch) {
			str = str || '';
			for (var i = 0; i < str.length; i++) {
				if (str.charAt(i) !== ch) {
					return i;
				}
			}
			return str.length;
		},

		countTrailingChars: function(str, ch) {
			str = str || '';
			for (var i = 0; i < str.length; i++) {
				if (str.charAt(str.length - 1 - i) !== ch) {
					return i;
				}
			}
			return str.length;
		},

		equals: function(str1, str2) {
			str1 = str1 || '';
			str2 = str2 || '';
			return (str1 === str2);
		},

		equalsIgnoreCase: function(str1, str2) {
			str1 = str1 || '';
			str2 = str2 || '';
			return (str1.toLowerCase() === str2.toLowerCase());
		},

		trimLeft: function(str, ch) {
			str = str || '';
			ch = ch || ' ';
			return str.substring(jC.string.countLeadingChars(str, ch), str.length);
		},

		trimRight: function(str, ch) {
			str = str || '';
			ch = ch || ' ';
			return str.substring(0, str.length - jC.string.countTrailingChars(str, ch));
		},

		trimZero: function(str) {
			return jC.string.trimLeft(str, '0');
		},

		times: function(str, count) {
			str = jC.object.toNonNullString(str);
			return (count < 1) ? '' : new Array(count + 1).join(str);
		},

		padLeft: function(str, len, ch) {
			str = jC.object.toNonNullString(str);
			ch = ch || ' ';
			return jC.string.times(ch, len - str.length) + str;
		},

		padRight: function(str, len, ch) {
			str = jC.object.toNonNullString(str);
			ch = ch || ' ';
			return str + jC.string.times(ch, len - str.length);
		},

		padZero: function(str, len) {
			return jC.string.padLeft(str, len, '0');
		},

		beforeFirst: function(str, ch) {
			str = str || '';
			ch = ch || ' ';
			var i = str.indexOf(ch);
			return (i >= 0) ? str.substring(0, i) : String(str);
		},

		left: function(str, len) {
			str = (str || '');
			return str.substring(0, len);
		},

		right: function(str, len) {
			str = (str || '');
			return str.substring(str.length - len);
		},

		exceptLeft: function(str, len) {
			str = (str || '');
			return str.substring(len);
		},

		exceptRight: function(str, len) {
			str = (str || '');
			return str.substring(0, str.length - len);
		},

		beforeLast: function(str, ch) {
			str = str || '';
			ch = ch || ' ';
			var i = str.lastIndexOf(ch);
			return (i >= 0) ? str.substring(0, i) : '';
		},

		afterFirst: function(str, ch) {
			str = str || '';
			ch = ch || ' ';
			var i = str.indexOf(ch);
			return (i >= 0) ? str.substring(i + 1) : '';
		},

		afterLast: function(str, ch) {
			str = str || '';
			ch = ch || ' ';
			var i = str.lastIndexOf(ch);
			return (i >= 0) ? str.substring(i + 1) : String(str);
		},

		betweenLast: function(str, ch1, ch2) {
			str = str || '';
			var i2 = str.lastIndexOf(ch2);
			if (i2 >= 0) {
				var i1 = str.lastIndexOf(ch1, i2);
				if (i1 >= 0) {
					return str.substring(i1 + 1, i2);
				}
			}
			return '';
		},

		isDigit: function(str) {
			str = str || '';
			if (str.length === 1) {
				var ch = str.charAt(0);
				return ((ch >= '0') && (ch <= '9'));
			}
			return false;
		},

		isNumericOnly: function(str) {
			str = str || '';
			return (str.match(/^\d*$/) !== null);
		},

		isInteger: function(str) {
			str = str || '';
			return (str.match(/^-?\d+$/) !== null);
		},

		escapeRegExp: function(str) {
			str = str || '';
			return str.replace(/([.*+?\^${}()|\[\]\/\\])/g, '\\$1');
		},

		toInt: function(str) {
			str = str || '';
			str = jC.string.trimZero($.trim(str));
			return (str.length > 0) ? parseInt(str, 10) : 0;
		},

		nl2br: function(str) {
			str = str || '';
			return str.replace(/(\r\n|\n\r|\r|\n)/g, '<br />' +'$1');
		},

		replaceSubstrAt: function (str, replacement, i, len) {
			return str.substr(0, i) + replacement + (len ? str.substr(i + len) : '');
		},

		splitInts: function(str, sep) {
			str = str || '';
			return $.map(str.split(sep), function(s) { return jC.string.toInt(s); });
		},

		splitToLength: function(str, len, sep) {
			str = str || '';
			var results = str.split(sep);
			jC.array.setLength(results, len, '');
			return results;
		},

		splitIntsToLength: function(str, len, sep) {
			str = str || '';
			var results = jC.string.splitInts(str, sep);
			jC.array.setLength(results, len, '');
			return results;
		},

		splitUsingLengths: function(str, lens) {
			var pos = 0;
			return $.map(lens, function(len) {
				var s = str.substr(pos, len);
				pos += len;
				return s;
			});
		},

		startsWith: function(str, substr) {
			return (str && (str.lastIndexOf(substr, 0) === 0));
		},

		insertCommas: function(str) {
			var REGEX = /(-?\d+)(\d{3})/;
			var result = str;
			while (REGEX.test(result)) {
				result = result.replace(REGEX, '$1,$2');
			}
			return result;
		},

		replaceFirstBracketedIndex: function(str, i) {
			var re = new RegExp('^([^\\[]*)\\[[^\\]]*\\](.*)$');
			return (str || '').replace(re, '$1[' + i + ']$2');
		},

		replaceBracketedIndexAfterPrefix: function(str, prefix, i) {
			var re = new RegExp('^(' + jC.string.escapeRegExp(prefix) + ')\\[[^\\]]*\\](.*)$');
			return (str || '').replace(re, '$1[' + i + ']$2');
		},

		replaceIndexAfterLastUnderscore: function(str, i) {
			str = (str || '');
			var pos = str.lastIndexOf('_');
			return (pos >= 0) ? (str.substring(0, pos + 1) + i) : str;
		},

		maskDigits: function(str) {
			return (str || '').replace(/[0-9]/g, 'x');
		},

		maskCreditCardNumber: function(ccn) {
			return jC.string.maskDigits(jC.string.exceptRight(ccn, 4)) + jC.string.right(ccn, 4);
		}
	};

// *** jC.number ***

	jC.number = {
		formatDollar: function(num) {
			var result = num.toFixed(2);
			if (result == '-0.00') { result = '0.00'; }
			return jC.string.insertCommas(result);
		},

		isDivisibleBy: function(num1, num2) {
			return ((num1 % num2) == 0);
		}
	};

// *** jC.date ***

	jC.date = {
		MILLIS_PER_DAY: 24 * 60 * 60 * 1000,

		now: function() {
			return new Date();
		},

		today: function() {
			return jC.date.clearTime(jC.date.now());
		},

		clearTime: function(date) {
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			date.setMilliseconds(0);
			return date;
		},

		addDays: function(date, days) {
			date.setDate(date.getDate() + days);
			return date;
		},

		copy: function(date) {
			return new Date(date.getTime());
		},

		copyDateOnly: function(date) {
			return jC.date.clearTime(jC.date.copy(date));
		},

		copyPlusDays: function(date, days) {
			return jC.date.addDays(jC.date.copy(date), days);
		},

		daysBetween: function(fromDate, toDate) {
			return Math.round((jC.date.copyDateOnly(toDate).getTime() - jC.date.copyDateOnly(fromDate).getTime())
					/jC.date.MILLIS_PER_DAY);
		},

		isLeapYear: function(year) {
			return (jC.number.isDivisibleBy(year, 4)
					&& (!jC.number.isDivisibleBy(year, 100) || jC.number.isDivisibleBy(year, 400)));
		},

		daysInMonth: function(year, month) {
			if ((year >= 0) && ((month >= 0) && (month <= 11))) {
				switch (month) {
					case  0: return 31;
					case  1: return jC.date.isLeapYear(year) ? 29 : 28;
					case  2: return 31;
					case  3: return 30;
					case  4: return 31;
					case  5: return 30;
					case  6: return 31;
					case  7: return 31;
					case  8: return 30;
					case  9: return 31;
					case 10: return 30;
					case 11: return 31;
				}
			}
			return undefined;
		},

		isValid: function(year, month, day) {
			return (year >= 0)
					&& (month >= 0) && (month <= 11)
					&& (day >= 1) && (day <= jC.date.daysInMonth(year, month));
		}
	};

// *** jC.date.universal ***

	jC.date.universal = {
		MONTH_INDEX_MAP: jC.array.indexMap('jan,feb,mar,apr,may,jun,jul,aug,sep,oct,nov,dec'.split(',')),

		isValidString: function(str) {
			str = str || '';
			var match = str.match(/^(\d{1,2})([^\d]{3})(\d{1,4})$/);
			if (match) {
				var month = jC.date.universal.MONTH_INDEX_MAP[match[2].toLowerCase()];
				if (!jC.isUndefined(month) && jC.date.isValid(parseInt(match[3], 10), month, parseInt(match[1], 10))) {
					return true;
				}
			}
			return false;
		}
	};

// *** jC.regex ***

	jC.regex = {
		execAll: function(regex, str) {
			var matches = [],
					match;
			while (match = regex.exec(str)) {
				matches.push(match);
			}
			return (matches.length > 0) ? matches : null;
		}
	};

// *** jC.xml ***

	jC.xml = {};

	jC.xml.escape = function(str) {
		str = str || '';
		return str.replace(jC.xml.escape.REGEXP, function(match) { return jC.xml.escape.MAP[match]; });
	};

	$.extend(jC.xml.escape, {
		REGEXP: /[&<>"'\/]/g,

		MAP: {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;'
		}
	});

// *** jC.template ***

	jC.template = {
		transformTags: function(template, transformer, defaultValue) {
			defaultValue = defaultValue || '';
			var result = template;
			var matches = jC.regex.execAll(/#\[(.*?)\]/g, template);
			if (matches) {
				for (var i = (matches.length - 1); i >= 0; i--) {
					var match = matches[i];
					var replacement = jC.defaultIfNullOrUndefined(
							((match[1] != '#[') ? jC.transform(match[1], transformer) : '#['), defaultValue);
					result = jC.string.replaceSubstrAt(result, replacement, match.index, match[0].length);
				}
			}
			return result;
		},

		replaceTags: function(template, map, defaultValue) {
			return jC.template.transformTags(template, jC.transformer.mapLookup(map), defaultValue);
		},

		replaceTagsWithProperties: function(template, obj, defaultValue) {
			return jC.template.transformTags(template, jC.transformer.propertyLookup(obj), defaultValue);
		}
	};

// *** jC.url ***

	jC.url = {
		addParams: function(baseUrl, params) {
			if (params) {
				var queryString = $.param(params);
				if (queryString) {
					return baseUrl + ((baseUrl.indexOf('?') >= 0) ? '&' : '?') + queryString;
				}
			}
			return baseUrl;
		},

		addPathParams: function(baseUrl, pathParams) {
			var result = baseUrl;
			if (pathParams) {
				$.each(pathParams, function() { result += '/' + this; });
			}
			return result;
		}
	};

// *** jC.DoublyLinkedList ***

	jC.DoublyLinkedList = jC.createClass(function() {
		this.head = null;
		this.tail = null;
	}, {
		add: function(data) {
			var node = { data: data };
			if (this.tail) {
				node.prev = this.tail;
				this.tail.next = node;
				this.tail = node;
			} else {
				this.head = this.tail = node;
			}
			return node;
		},

		isEmpty: function() {
			return !this.tail;
		},

		remove: function(node) {
			if (this.head == node) { this.head = node.next; }
			if (this.tail == node) { this.tail = node.prev; }
			if (node.prev) { node.prev.next = node.next; }
			if (node.next) { node.next.prev = node.prev; }
		}
	});

// *** jC.transformer ***

	jC.transformer = {
		ELEMENT_ID: function(el) { return $(el).attr('id'); },

		elementAttr: function(name) {
			return function(el) { return $(el).attr(name); };
		},

		elementData: function(key) {
			return function(el) { return $(el).data(key); };
		},

		elementIdAfter: function(ch) {
			return function(el) { return jC.string.afterFirst($(el).attr('id'), ch); };
		},

		mapLookup: function(map) {
			return function(key) { return !jC.isNullOrUndefined(map) ? map[key] : null; };
		},

		property: function(property) {
			return function(obj) { return jC.object.getProperty(obj, property); };
		},

		propertyLookup: function(obj) {
			return function(property) {
				return !jC.isNullOrUndefined(obj) ? jC.object.getProperty(obj, property) : null;
			};
		}
	};

// *** jC.comparator ***

	jC.comparator = function(options) {
		options = options || {};
		var result = options.comparator || jC.comparator.NATURAL;
		if (options.property) { result = jC.comparator.property(options.property, result); }
		if (options.transformer) { result = jC.comparator.transformed(options.transformer, result); }
		if (options.data) { result = jC.comparator.elementData(options.data, result); }
		if (options.nulls) { result = jC.comparator.nulls(options.nulls, result); }
		if (options.reverse) { result = jC.comparator.reverse(result); }
		return result;
	};

	$.extend(jC.comparator, {
		IGNORE_CASE: jC.object.stringCompareIgnoreCase,

		NATURAL: function(v1, v2) {
			return (v1 > v2) ? 1 : ((v1 < v2) ? -1 : 0);
		},

		chain: function(/* 1..N comparators */) {
			var comparators = $.makeArray(arguments);
			return function(v1, v2) {
				var result = 0;
				$.each(comparators, function() {
					result = this.call(null, v1, v2);
					return (result === 0);
				});
				return result;
			};
		},

		elementAttr: function(name, comparator) {
			return jC.comparator.transformed(jC.transformer.elementAttr(name), comparator);
		},

		elementData: function(key, comparator) {
			return jC.comparator.transformed(jC.transformer.elementData(key), comparator);
		},

		elementId: function(comparator) {
			return jC.comparator.transformed(jC.transformer.ELEMENT_ID, comparator);
		},

		elementIdAfter: function(ch, comparator) {
			return jC.comparator.transformed(jC.transformer.elementIdAfter(ch), comparator);
		},

		mapLookup: function(map, comparator) {
			return jC.comparator.transformed(jC.transformer.mapLookup(map), comparator);
		},

		nulls: function(nullPos, comparator) {
			comparator = comparator || jC.comparator.NATURAL;
			return function(v1, v2) {
				var isNull1 = (v1 == null),
						isNull2 = (v2 == null);
				if (!isNull1 && !isNull2) {
					return comparator.call(null, v1, v2);
				} else if (isNull1 && !isNull2) {
					return (nullPos === 'high') ? 1 : -1;
				} else if (!isNull1 && isNull2) {
					return (nullPos === 'high') ? -1 : 1;
				} else {
					return 0;
				}
			};
		},

		property: function(property, comparator) {
			return jC.comparator.transformed(jC.transformer.property(property), comparator);
		},

		propertyIgnoreCase: function(property) {
			return jC.comparator.property(property, jC.comparator.IGNORE_CASE);
		},

		reverse: function(comparator) {
			comparator = comparator || jC.comparator.NATURAL;
			return function(v1, v2) {
				return -1 * comparator.call(null, v1, v2);
			};
		},

		transformed: function(transformer, comparator) {
			comparator = comparator || jC.comparator.NATURAL;
			return function(o1, o2) {
				return comparator.call(null, jC.transform(o1, transformer), jC.transform(o2, transformer));
			};
		}
	});

// *** jC.RadioGroup ***

	jC.RadioGroup = jC.createClass(function($element, name) {
		if ($element) {
			$element = jC.$($element);
			var element = $element[0];
			if (element.type && (element.type.toLowerCase() == 'radio')) {
				this.form = element.form;
				this.name = element.name;
			} else if (element.tagName.toLowerCase() == 'form') {
				this.form = element;
				this.name = name;
			} else {
				throw 'Invalid arguments to RadioGroup constructor';
			}
		} else {
			this.form = null;
			this.name = name;
		}
	}, {
		clear: function() {
			$.each(this.getButtons(), function() { this.checked = false; });
			return this;
		},

		disable: function() {
			$.each(this.getButtons(), function() { $(this).prop('disabled', true); });
			return this;
		},

		enable: function() {
			$.each(this.getButtons(), function() { $(this).prop('disabled', false); });
			return this;
		},

		getButton: function(value) {
			return jC.find(this.getButtons(), function() { return (this.value == value); });
		},

		getButtonAt: function(index) {
			return this.getButtons()[index];
		},

		getButtons: function() {
			var selector = 'input:radio[name="' + this.name + '"]';
			return (this.form ? $(this.form).find(selector) : $(selector)).get();
		},

		getCheckedButton: function() {
			return jC.find(this.getButtons(), function() { return this.checked; });
		},

		getSelectedIndex: function() {
			return jC.findIndex(this.getButtons(), function() { return this.checked; });
		},

		getValue: function() {
			var checkedButton = this.getCheckedButton();
			return checkedButton ? checkedButton.value : null;
		},

		setCheckedButton: function(button) {
			if (button) {
				button.checked = true;
			} else {
				this.clear();
			}
			return this;
		},

		setSelectedIndex: function(index) {
			this.setCheckedButton(this.getButtonAt(index));
			return this;
		},

		setValue: function(value) {
			this.setCheckedButton(this.getButton(value));
			return this;
		}
	});

// *** jC.relativePos ***

	jC.relativePos = function($target, location, dim, offset) {
		$target = jC.$($target);
		offset = offset || {};

		var targetDim = $target.jC_outerDimensions(),
				targetPos = $target.offset();

		switch(location) {
			case 'above': return {
				x: targetPos.left + Math.ceil((targetDim.width - dim.width) / 2) + (offset.x || 0),
				y: targetPos.top - dim.height + (offset.y || 0)
			};
			case 'below': return {
				x: targetPos.left + Math.ceil((targetDim.width - dim.width) / 2) + (offset.x || 0),
				y: targetPos.top + targetDim.height + (offset.y || 0)
			};
			case 'center': return {
				x: targetPos.left + Math.ceil((targetDim.width - dim.width) / 2) + (offset.x || 0),
				y: targetPos.top + Math.ceil((targetDim.height - dim.height) / 2) + (offset.y || 0)
			};
			case 'left': return {
				x: targetPos.left - dim.width + (offset.x || 0),
				y: targetPos.top + Math.ceil((targetDim.height - dim.height) / 2) + (offset.y || 0)
			};
			case 'right': return {
				x: targetPos.left + targetDim.width + (offset.x || 0),
				y: targetPos.top + Math.ceil((targetDim.height - dim.height) / 2) + (offset.y || 0)
			};
		}
		return null;
	};

	$.each(("above below center left right").split(' '), function(i, location) {
		jC.relativePos[location] = function($target, dim, offset) {
			return jC.relativePos($target, location, dim, offset);
		};
	});

// *** jC.Spinner ***

	jC.Spinner = jC.createInterface({
		hide: jC.ABSTRACT_METHOD, // No params.
		show: jC.ABSTRACT_METHOD  // No params.
	});

// *** jC.Spinner.Element ***

	jC.Spinner.Element = jC.createClass(jC.Spinner, function(param1, param2, param3) {
		jC.Spinner.call(this);
		if (arguments.length > 1) {
			this._pos = function(element) { return jC.relativePos(param1, param2, $(element).jC_dim(), param3); };
		} else {
			this._pos = param1;
		}
		this._$element = null;
	}, {
		_doCreateElement: jC.ABSTRACT_METHOD, // No params.

		hide: function() {
			if (this.isShowing()) {
				this._$element.remove();
				this._$element = null;
			}
			return this;
		},

		isShowing: function() {
			return !!this._$element;
		},

		show: function() {
			if (!this.isShowing()) {
				this._$element = $(this._doCreateElement());
				var pos = $.isFunction(this._pos) ? this._pos.call(this, this._$element[0]) : this._pos;
				this._$element.css({
					position: 'absolute',
					left: pos.x,
					top: pos.y,
					zIndex: jC.Spinner.Element.Z_INDEX
				})
						.appendTo(document.body);
			}
			return this;
		}
	});

	$.extend(jC.Spinner.Element, {
		Z_INDEX: 99999 // TODO - Should I allow for this to be overridden per instance?
	});

// *** jC.Spinner.Image ***

	jC.Spinner.Image = jC.createClass(jC.Spinner.Element, function() {
		jC.Spinner.Element.apply(this, arguments);
	}, {
		_doCreateElement: function() {
			var info = this._doGetImageInfo(),
					height = info.dim ? info.dim.height : undefined,
					width = info.dim ? info.dim.width : undefined,
					alt = info.alt || '';
			return $('<img />', { src: info.url, width: width, height: height, alt: alt })[0];
		},

		_doGetImageInfo: jC.ABSTRACT_METHOD  // No params.
	});

// *** jC.SpinnerOverlay ***

	jC.SpinnerOverlay = jC.createClass(jC.Spinner, function() {
		jC.Spinner.call(this);
		this._$overlay = null;
		this._count = 0;
	}, {
		_doCreateOverlay: jC.ABSTRACT_METHOD, // No params.

		hide: function() {
			if (this._$overlay) {
				this._count--;
				if (this._count == 0) {
					this._$overlay.remove();
					this._$overlay = null;
				}
			}
		},

		show: function() {
			if (!this._$overlay) {
				this._$overlay = $(this._doCreateOverlay());
				$(jC.topUsableWindow.document.body).append(this._$overlay);
			}
			this._count++;
		}
	});

// *** jC.Overlay ***

	jC.Overlay = function($element, options) {
		options = options || {};

		this.$element = jC.$($element).first();

		this.$element.wrap($('<div></div>').css({
			position: 'relative',
			margin: 0,
			padding: 0
		}));

		var $overlay = $('<div></div>').css({
			position: 'absolute',
			backgroundColor: '#ffffff',
			opacity: 0,
			left: 0,
			top: 0,
			width: '100%',
			height: '100%'
		});

		jC.callback.call(options.modifyOverlay, null, $overlay);

		this.$element.parent().append($overlay);
	};

	$.extend(jC.Overlay.prototype, {
		remove: function() {
			this.$element.siblings(':last').remove();
			this.$element.unwrap();
		}
	});

// *** jC.Overlay.Fullscreen ***

	jC.Overlay.Fullscreen = function(options) {
		options = options || {};
		this.$element = $('<div></div>').css({
			backgroundColor: options.backgroundColor || '#000000',
			bottom: 0,
			height: '100%',
			opacity: jC.defaultIfNullOrUndefined(options.opacity, 0.5),
			overflow: 'hidden',
			position: 'fixed',
			top: 0,
			width: '100%',
			zIndex: jC.defaultIfNullOrUndefined(options.zIndex, 10000)
		}).appendTo(document.body);
	};

	$.extend(jC.Overlay.Fullscreen.prototype, {
		show: function() {
			this.$element.appendTo(document.body);
			return this;
		},

		hide: function() {
			this.$element.remove();
			return this;
		},

		zIndex: function() {
			return parseInt(this.$element.css('z-index'));
		}
	});

// *** jC.ajax ***

	jC.ajax = function(type, dataType, url, settings) {
		return $.ajax(url, $.extend({ type: type, dataType: dataType }, settings));
	};

	$.extend(jC.ajax, {
		abort: function(jqxhr) {
			if (jqxhr) {
				jqxhr.abort();
			}
		},

		get: function(dataType, url, settings) {
			return jC.ajax('GET', dataType, url, settings);
		},

		multiLoad: function(url, containers, settings) {
			jC.ajax.getXml(url, $.extend({}, settings, {
				success: jC.callback.chain(function(xml) {
					$.each(xml.getElementsByTagName('block'), function(index, block) {
						var container = $.isArray(containers) ? containers[index] : containers[block.getAttribute('name')];
						if (container) {
							jC.$(container).html(jC.dom.getNodeContent(block));
						}
					});
				}, settings.success)
			}));
		},

		post: function(dataType, url, settings) {
			return jC.ajax('POST', dataType, url, settings);
		},

		postJson: function(dataType, url, settings) {
			var data = (typeof settings.data !== 'string') ? JSON.stringify(settings.data) : settings.data;
			return jC.ajax.post(dataType, url, $.extend({ contentType: 'application/json' }, settings, { data: data }));
		}
	});

	$.each(("Html Json Text Xml").split(' '), function(i, dataType) {
		jC.ajax['get' + dataType] = function(url, settings) {
			return jC.ajax.get(dataType.toLowerCase(), url, settings);
		};
		jC.ajax['postReturn' + dataType] = function(url, settings) {
			return jC.ajax.post(dataType.toLowerCase(), url, settings);
		};
		jC.ajax['postJsonReturn' + dataType] = function(url, settings) {
			return jC.ajax.postJson(dataType.toLowerCase(), url, settings);
		};
	});

// *** jC.ajax.error ***

	jC.ajax.error = {
		DEFAULT_TREATMENT: function(jqxhr, textStatus) {},

		beforeDefaultCallback: function(callback) {
			return jC.ajax.error.callback(function() {
				jC.callback.chain(true, callback, jC.ajax.error.DEFAULT_TREATMENT).apply(this, arguments);
			});
		},

		callback: function(callback) {
			return function(jqxhr, textStatus) {
				if ((textStatus != 'abort') && (jqxhr.status != 0)) {
					jqxhr.expectedError = jqxhr.getResponseHeader('Expected-Error');
					callback.apply(this, arguments);
				}
			};
		},

		defaultCallback: function() {
			jC.ajax.error.callback(jC.ajax.error.DEFAULT_TREATMENT).apply(this, arguments);
		}
	};

// *** jC.placeholder ***

	jC.placeholder = {
		instrumentAll: function($container, includeContainer) {
			if (!jC.support.PLACEHOLDER) {
				var $inputs = jC.contained$('input:text[placeholder]', $container, includeContainer);

				$inputs.focus(function() {
					var $input = $(this);
					if ($input.val() == $input.attr('placeholder')) {
						$input.val('');
					}
					$input.removeClass('placeholder');
				}).blur(function() {
							var $input = $(this);
							if (($input.val() == '') || ($input.val() == $input.attr('placeholder'))) {
								$input.addClass('placeholder').val($input.attr('placeholder'));
							}
						});

				$inputs.parents('form').submit(function() {
					$(this).find('input:text[placeholder]').focus();
				});

				$inputs.blur();
			}
		}
	};

// *** jC.tabbingContainer ***

	jC.tabbingContainer = {
		HANDLER_DATA_NAME: 'jC_tabbingContainer_handler',

		instrument: function($containers) {
			$containers = jC.$($containers);
			if ($containers.length > 0) {
				var handler = function(e) {
					if (e.which === 9) {
						var $tabbables = $(this).find(':tabbable');
						if ($tabbables.length > 0) {
							var $first = $tabbables.filter(':first'),
								$last = $tabbables.filter(':last');
							if (!e.shiftKey && (e.target === $last[0])) {
								setTimeout(function() { $first.focus(); }, 1);
								return false;
							} else if (e.shiftKey && (e.target === $first[0])) {
								setTimeout(function() { $last.focus(); }, 1);
								return false;
							}
						} else {
							return false;
						}
					}
					return true;
				};
				$containers.keydown(handler).data(jC.tabbingContainer.HANDLER_DATA_NAME);
			}
		},

		uninstrument: function($containers) {
			jC.$($containers).each(function() {
				var $container = $(this),
					handler = $container.data(jC.tabbingContainer.HANDLER_DATA_NAME);
				if (handler) {
					$container.off('keydown', handler);
				}
			});
		}
	};

// *** jC.tabList ***

	jC.tabList = {
		instrument: function($lists) {
			$lists = jC.$($lists);
			$lists.each(function() {
				var $list = $(this),
					$tabs = $list.children('li'),
					$panels = $();
				$list.jC_addMultiValueAttr('role', 'tablist');
				$tabs.each(function() {
					var $tab = $(this),
						$panel = jC.id$(jC.string.afterFirst($tab.children('a:first').attr('href'), '#'));
					$tab.jC_addMultiValueAttr('aria-controls', $panel.attr('id'));
					$tab.attr('aria-selected', 'false');
					$tab.jC_addMultiValueAttr('role', 'tab');
					$panel.jC_addMultiValueAttr('aria-labelledby', $tab.attr('id'));
					$panel.jC_addMultiValueAttr('role', 'tabpanel');
					$panels = $panels.add($panel);

					$tab.click(function(event) {
						event.preventDefault();
						$tabs.removeClass('active').attr('aria-selected', 'false');
						$tab.addClass('active').attr('aria-selected', 'true');
						$panels.hide().attr('aria-hidden', 'true');
						$panel.show().attr('aria-hidden', 'false');
					});
				}).filter('.active:first,:first').first().click();
			});
		}
	};

// *** jC.SimpleLightbox ***

	jC.SimpleLightbox = function(options) {
		options = options || {};

		this._containTabbing = jC.defaultTrue(options.containTabbing);
		this._focusTo = jC.defaultIfNullOrUndefined(options.focusTo, 'first-child');
		this._hideScrollbar = jC.defaultTrue(options.hideScrollbar);
		this._$returnFocusTo = options.returnFocusTo ? jC.$(options.returnFocusTo) : null;

		this._beforeOpen = options.beforeOpen;
		this._afterOpen = options.afterOpen;
		this._beforeClose = options.beforeClose;
		this._afterClose = options.afterClose;

		this.externalOverlay = new jC.Overlay.Fullscreen();
		this.$frame = $('<div></div>').css({
			left: 0,
			margin: 0,
			overflow: 'hidden',
			padding: 0,
			position: 'fixed',
			top: 0,
			zIndex: jC.defaultIfNullOrUndefined(options.zIndex, this.externalOverlay.zIndex() + 1)
		});

		if (jC.defaultTrue(options.closeOnClickOutside)) {
			this.externalOverlay.$element.click($.proxy(function() {
				this.close();
			}, this));
		}

		if (jC.defaultTrue(options.closeOnEscKey)) {
			this.$frame.keydown($.proxy(function(event) {
				if (event.which == 27) {
					this.close();
					event.stopPropagation();
				}
			}, this));
		}
	};

	$.extend(jC.SimpleLightbox.prototype, {
		open: function() {
			jC.callback.call(this._beforeOpen, this);
			if (this._hideScrollbar) {
				jC.document.hideVerticalScrollbarCommand.execute();
			}
			this.externalOverlay.show();
			this.$frame.appendTo(document.body).jC_centerIn(jC.viewport.size(), { yRatio: 0.382 });
			if (this._containTabbing) {
				jC.tabbingContainer.instrument(this.$frame);
			}
			if (this._focusTo === 'first-child') {
				this.$frame.children(':first').jC_forceFocus();
			}
			jC.callback.call(this._afterOpen, this);
			return this;
		},

		close: function() {
			jC.callback.call(this._beforeClose, this);
			this.$frame.remove();
			this.externalOverlay.hide();
			if (this._hideScrollbar) {
				jC.document.hideVerticalScrollbarCommand.undo();
			}
			if (this._$returnFocusTo) {
				this._$returnFocusTo.focus();
			}
			jC.callback.call(this._afterClose, this);
			return this;
		}
	});

// *** jQuery Extensions ***

	$.extend($.fn, {
		jC_addMultiValueAttr: function(attrName, val) {
			return this.each(function() {
				var $element = $(this),
					arr = $element.jC_multiValueAttr(attrName) || [];
				if (!jC.array.contains(arr, val)) {
					arr.push(val);
					$element.jC_multiValueAttr(attrName, arr);
				}
			});
		},

		jC_autoInstrument: function(includeThis) {
			return this.each(function() { jC.autoInstrument($(this), includeThis); });
		},

		jC_autoInstrumentedHtml: function(html, includeThis) {
			return this.html(html).jC_autoInstrument(includeThis);
		},

		jC_centerIn: function(dim, options) {
			options = options || {};
			var xRatio = jC.defaultIfNullOrUndefined(options.xRatio, 0.5),
				yRatio = jC.defaultIfNullOrUndefined(options.yRatio, 0.5);
			return this.each(function() {
				var $element = $(this),
					elementDim = $element.jC_dim();
				$element.css({
					left: (dim.width > elementDim.width) ? Math.floor((dim.width - elementDim.width) * xRatio) : 0,
					top: (dim.height > elementDim.height) ? Math.floor((dim.height - elementDim.height) * yRatio) : 0
				});
			});
		},

		jC_deserializeObject: function(obj) {
			var $elements = this.map(function() {
				return this.elements ? $.makeArray(this.elements) : this;
			});
			$.each(obj, function(name, value) {
				$elements.filter('[name="' + name + '"]').each(function() {
					var $element = $(this);
					if ($element.is('input:checkbox, input:radio')) {
						var btnValue = $element.prop('value');
						$element.prop('checked', $.isArray(value)
								? jC.array.contains(value, btnValue) : (value == btnValue));
					} else if ($element.is('select[multiple]')) {
						$element.val(!$.isArray(value) ? [value] : value);
					} else {
						$element.val(value);
					}
				});
			});
			return this;
		},

		jC_deserializeNestedObject: function(obj) {
			this.jC_deserializeObject(jC.object.getFlat(obj));
			return this;
		},

		jC_dim: function() {
			return this.jC_exists() ? { height: this.height(), width: this.width() } : null;
		},

		jC_disable: function() {
			return this.prop('disabled', true);
		},

		jC_enable: function() {
			return this.prop('disabled', false);
		},

		jC_ensureFocusable: function() {
			var $element = this.first(),
				hasTabindex = $element.jC_hasAttr('tabindex');
			if (!hasTabindex) {
				$element.attr('tabindex', -1);
				return true;
			}
			return false;
		},

		jC_exists: function() {
			return (this.length > 0);
		},

		jC_fixedPos: function() {
			if (this.jC_exists()) {
				var offset = this.offset(),
						scrollPos = jC.document.scrollPos();
				return { left: (offset.left - scrollPos.left), top: (offset.top - scrollPos.top) };
			}
			return null;
		},

		jC_followLink: function() {
			return this.each(function() {
				var $link = $(this);
				jC.window.openPage($link.attr('href'), { target: $link.attr('target') });
			});
		},

		jC_forceFocus: function(cleanUp) {
			cleanUp = jC.defaultFalse(cleanUp);
			return this.each(function() {
				var $element = $(this),
					changed = $element.jC_ensureFocusable();
				$element.focus();
				if (cleanUp && changed) {
					$element.removeAttr('tabindex');
				}
			});
		},

		jC_hasAttr: function(name) {
			var attr = this.attr(name);
			return (attr !== undefined) && (attr !== false);
		},

		jC_hasMultValueAttr: function(attrName, val) {
			var arr = this.jC_multiValueAttr(attrName);
			return (arr != undefined) && jC.array.contains(arr, val);
		},

		jC_getOrCreateDataArray: function(key) {
			var a = this.data(key);
			if (!a) {
				a = [];
				this.data(key, a);
			}
			return a;
		},

		jC_idAfter: function(ch) {
			return this.jC_exists() ? jC.string.afterFirst(this.attr('id'), ch) : null;
		},

		jC_isEnabled: function() {
			return !this.prop('disabled');
		},

		jC_isLabelFor: function($input) {
			$input = jC.$($input);
			if ($input.jC_exists() && this.jC_exists() && (this[0].nodeName === 'LABEL')) {
				return (this[0] === $input.jC_label());
			}
			return false;
		},

		jC_isTargetSelf: function() {
			return this.jC_exists() ? jC.window.isTargetSelf(this.attr('target')) : undefined;
		},

		jC_label: function() {
			return this.jC_labelForId() || this.jC_nestingLabel() || null;
		},

		jC_labelForId: function() {
			if (this.jC_exists()) {
				var id = this.attr('id');
				if (id) {
					var $label = $('label[for="' + id + '"]');
					if ($label.jC_exists()) {
						return $label[0];
					}
				}
			}
			return null;
		},

		jC_multiValueAttr: function (attrName, arr) {
			if (jC.isUndefined(arr)) {
				var attr = this.attr(attrName);
				if ((attr !== undefined) && (attr !== false)) {
					return attr.trim().split(/\s+/);
				}
				return undefined;
			}
			return this.attr(attrName, (arr !== null) ? arr.join(' ') : null);
		},

		jC_nestingLabel: function() {
			if (this.jC_exists()) {
				var $label = $(this[0]).closest('label');
				if ($label.jC_exists()) {
					return $label[0];
				}
			}
			return null;
		},

		jC_outerDimensions: function() {
			return this.jC_exists() ? { height: this.outerHeight(), width: this.outerWidth() } : null;
		},

		jC_reindexAttr: function(attrName, index, callback) {
			return this.each(function() {
				var $element = $(this);
				if ($element.jC_hasAttr(attrName)) {
					$element.attr(attrName, function(i, attr) { return callback.call($element[0], attr, index); })
				}
			});
		},

		jC_reindexMultiAttrAt: function(attrName, attrIndex, index, callback /* this=element, params=(attr, index))*/) {
			return this.each(function() {
				var $element = $(this),
					arr = $element.jC_multiValueAttr(attrName);
				if (arr.length > attrIndex) {
					arr[attrIndex] = callback.call($element[0], arr[attrIndex], index);
					$element.jC_multiValueAttr(attrName, arr);
				}
			});
		},

		jC_removeMultiValueAttr: function(attrName, val) {
			return this.each(function() {
				var $element = $(this),
					arr = $element.jC_multiValueAttr(attrName);
				jC.array.remove(arr, val);
				$element.jC_multiValueAttr(attrName, arr);
			});
		},

		jC_scrollIntoView: function($container) {
			$container =  ($container != null) ? jC.$($container) : null;
			return this.each(function() {
				var $item = $(this),
						$itemContainer = $container || $item.parent(),
						top = $itemContainer.offset().top,
						bottom = top + $itemContainer.innerHeight(),
						itemTop = $item.offset().top,
						itemBottom = itemTop + $item.height();
				if (itemTop < top) {
					$itemContainer.scrollTop($itemContainer.scrollTop() + itemTop - top);
				} else if (itemBottom > bottom) {
					$itemContainer.scrollTop($itemContainer.scrollTop() + itemBottom - bottom);
				}
			});
		},

		jC_serializeNestedObject: function() {
			return jC.object.getNested(this.jC_serializeObject());
		},

		jC_serializeObject: function() {
			var result = {};
			$.each(this.serializeArray(), function(i, pair) {
				if (!jC.isUndefined(result[pair.name])) {
					if (!$.isArray(result[pair.name])) {
						result[pair.name] = [result[pair.name]];
					}
					result[pair.name].push(pair.value || '');
				} else {
					result[pair.name] = pair.value || '';
				}
			});
			return result;
		},

		jC_sortChildElements: function(comparator) {
			return this.each(function() {
				var $parent = $(this),
						childElements = $parent.children().get();
				childElements.sort(comparator);
				$.each(childElements, function() { $parent.append(this); });
			});
		},

		jC_toggleEnabledState: function(state) {
			return this.each(function() {
				var $this = $(this);
				$this[(jC.isNullOrUndefined(state) ? !$this.jC_isEnabled() : state) ? 'jC_enable' : 'jC_disable']();
			});
		},

		jC_valAsFloat: function() {
			var val = this.val();
			return ((val != '') && !isNaN(val)) ? parseFloat(val) : undefined;
		}
	});

// *** Setup ***

	$(document).ready(function() {
		$.ajaxSetup({ error: jC.ajax.error.defaultCallback });
	});

// *** Global Scope ***

	window.jC = jC;

})(window, jQuery);
