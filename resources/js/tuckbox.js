// *** Tuck Box Library ***

(function(window, $, undefined) {

	// *** Enum: Units ***

	var Units = (function() {
		var INCHES_ID = 'INCHES',
			MM_ID = 'MM';

		function _constructor(id, name, abbrev, round, conversionScales) {
			this.id = id;
			this.name = name;
			this.abbrev = abbrev;
			this.round = round;
			this.conversionScales = conversionScales;
		};

		_constructor.prototype = {
			convert: function(value, fromUnits) {
				if (!this.equals(fromUnits)) {
					var scale = fromUnits.conversionScales[this.id];
					return Math.round((value * scale.n * this.round) / scale.d) / this.round;
				}
				return value;
			},

			equals: function(other) {
				return this.id === other.id;
			}
		};

		return $.extend(function(id) {
			switch(id) {
				case INCHES_ID: return Units.INCHES;
				case MM_ID: return Units.MM;
			}
		}, {
			INCHES: new _constructor(INCHES_ID, 'Inches', 'in', 1000, { MM: { n: 254, d: 10 } }),
			MM: new _constructor(MM_ID, 'Millimeters', 'mm', 10, { INCHES: { n: 10, d: 254 } }),

			equals: function(units1, units2) {
				return (units1) ? units1.equals(units2) : !units2;
			}
		});
	})();

	var INDENT = '  ',
		ATTR_INDENT = '   ';

	var outlineSettings = {
		pen: {
			width: 0.2,
			color: '#000000'
		}
	}

	function repeatString(s, times) {
		var text = '';
		for (var i = 0; i < times; i++) {
			text += s;
		}
		return text;
	}

	function styleMapToString(styleMap) {
		var tokens = [];
		$.each(styleMap, function(name, value) {
			tokens.push(name + ':' + value);
		});
		return tokens.join(';');
	}

	function createBrushStyleMap(color) {
		return {
			'fill': color,
			'fill-opacity': 1,
			'fill-rule': 'evenodd',
			'stroke': 'none',
			'stroke-width': 0,
			'stroke-opacity': 1
		};
	}

	function createPenStyleMap(width, color) {
		return {
			'fill': 'none',
			'stroke': color,
			'stroke-width': width,
			'stroke-linecap': 'butt',
			'stroke-linejoin': 'miter',
			'stroke-miterlimit': 4,
			'stroke-dasharray': 'none',
			'stroke-opacity': 1
		};
	}

	// *** Class: Element ***

	function Element(name) {
		this.attrs = {};
		this.children = [];
		this.name = name;
		this.text = null;
	}

	Element.prototype = {
		addChild: function(element) {
			this.children.push(element);
			return element;
		},

		addChildren: function(/* element... */) {
			$.each(arguments, $.proxy(function(i, element) {
				this.addChild(element);
			}, this));
			return this;
		},

		addNewChild: function(name) {
			return this.addChild(new Element(name));
		},

		setAttr: function(name, value) {
			this.attrs[name] = value;
			return this;
		},

		setText: function(text) {
			this.text = text;
			return this;
		},

		toString: function(level) {
			level = level || 0;

			var indent = repeatString(INDENT, level),
				text = indent + '<' + this.name;

			if (Object.keys(this.attrs).length > 0) {
				$.each(this.attrs, function(name, value) {
					text += '\n' + indent + ATTR_INDENT + name + '="' + value + '"';
				});
			}

			if (this.children.length > 0) {
				text += '>\n';
				$.each(this.children, function(i, child) {
					text += child.toString(level + 1) + '\n';
				});
				text += indent + '</' + this.name + '>';
			} else if (this.text != null) {
				text += '>' + this.text + '</' + this.name + '>';
			} else {
				text += ' />';
			}

			return text;
		}
	};

	// *** Class: Pos ***

	function Pos(x, y) {
		this.x = x;
		this.y = y;
	}

	$.extend(Pos, {
		clone: function(pos) {
			return new Pos(pos.x, pos.y);
		},

		midPoint: function(pos1, pos2) {
			return new Pos((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);
		}
	});

	// *** Class: PathSegment ***

	class PathSegment {
		constructor() {}
		
		command() {
			throw 'Abstract Method';
		}

		newPos(pos) {
			throw 'Abstract Method';
		}
	}
	
	PathSegment.createCommands = function(startPos, segments, options) {
		segments = $.isArray(segments) ? segments : [segments];
		options = options || {};
			
		var commands = [],
			pos = startPos;

		segments.unshift(new PathSegment.MoveTo(pos));

		$.each(segments, $.proxy(function(i, segment) {
			commands.push(segment.command(pos));
			pos = segment.newPos(pos);
		}, this));
		
		if (options.setPos) {
			options.setPos.call(null, pos);
		}

		return commands.join(' ');
	};

	// *** Class: PathSegment.MoveTo ***

	PathSegment.MoveTo = class extends PathSegment {
		constructor(toPos) {
			super();

			this.toPos = toPos;
		}

		command(pos) {
			return 'M ' + this.toPos.x + ',' + this.toPos.y;
		}

		newPos(pos) {
			return { x: this.toPos.x, y: this.toPos.y };
		}
	}

	// *** Class: PathSegment.HMoveTo ***

	PathSegment.HMoveTo = class extends PathSegment {
		constructor(toX) {
			super();

			this.toX = toX;
		}

		command(pos) {
			return 'M ' + this.toX + ',' + pos.y;
		}

		newPos(pos) {
			return { x: this.toX, y: pos.y };
		}
	}

	// *** Class: PathSegment.VMoveTo ***

	PathSegment.VMoveTo = class extends PathSegment {
		constructor(toY) {
			super();

			this.toY = toY;
		}

		command(pos) {
			return 'M ' + pos.x + ',' + this.toY;
		}

		newPos(pos) {
			return { x: pos.x, y: this.toY };
		}
	}

	// *** Class: PathSegment.LineBy ***

	PathSegment.LineBy = class extends PathSegment {
		constructor(dim) {
			super();

			this.dim = dim;
		}

		command(pos) {
			return 'L ' + (pos.x + this.dim.cx) + ',' + (pos.y + this.dim.cy);
		}

		newPos(pos) {
			return { x: (pos.x + this.dim.cx), y: (pos.y + this.dim.cy) };
		}
	}

	// *** Class: PathSegment.HLineBy ***

	PathSegment.HLineBy = class extends PathSegment {
		constructor(cx) {
			super();

			this.cx = cx;
		}

		command(pos) {
			return 'h ' + this.cx;
		}

		newPos(pos) {
			return { x: (pos.x + this.cx), y: pos.y };
		}
	}

	// *** Class: PathSegment.VLineBy ***

	PathSegment.VLineBy = class extends PathSegment {
		constructor(cy) {
			super();

			this.cy = cy;
		}

		command(pos) {
			return 'v ' + this.cy;
		}

		newPos(pos) {
			return { x: pos.x, y: (pos.y + this.cy) };
		}
	}

	// *** Class: PathSegment.LineTo ***

	PathSegment.LineTo = class extends PathSegment {
		constructor(toPos) {
			super();

			this.toPos = toPos;
		}

		command(pos) {
			return 'L ' + this.toPos.x + ',' + this.toPos.y;
		}

		newPos(pos) {
			return { x: this.toPos.x, y: this.toPos.y };
		}
	}

	// *** Class: PathSegment.HLineTo ***

	PathSegment.HLineTo = class extends PathSegment {
		constructor(toX) {
			super();

			this.toX = toX;
		}

		command(pos) {
			return 'H ' + this.toX;
		}

		newPos(pos) {
			return { x: this.toX, y: pos.y };
		}
	}

	// *** Class: PathSegment.VLineTo ***

	PathSegment.VLineTo = class extends PathSegment {
		constructor(toY) {
			super();

			this.toY = toY;
		}

		command(pos) {
			return 'V ' + this.toY;
		}

		newPos(pos) {
			return { x: pos.x, y: this.toY };
		}
	}

	// *** Class: PathSegment.ArcBy ***

	PathSegment.ArcBy = class extends PathSegment {
		constructor(dim, radii, dir) {
			super();

			this.dim = dim;
			this.radii = radii;
			this.dir = dir;
		}

		command(pos) {
			return 'A ' + this.radii.rx + ',' + this.radii.ry + ' 0 0 ' + this.dir + ' ' + (pos.x + this.dim.cx) + ',' + (pos.y + this.dim.cy);
		}

		newPos(pos) {
			return { x: (pos.x + this.dim.cx), y: (pos.y + this.dim.cy) };
		}
	}

	// *** Class: PathSegment.ArcTo ***

	PathSegment.ArcTo = class extends PathSegment {
		constructor(toPos, radii, dir) {
			super();

			this.toPos = toPos;
			this.radii = radii;
			this.dir = dir;
		}

		command(pos) {
			return 'A ' + this.radii.rx + ',' + this.radii.ry + ' 0 0 ' + this.dir + ' ' + this.toPos.x + ',' + this.toPos.y;
		}

		newPos(pos) {
			return { x: this.toPos.x, y: this.toPos.y };
		}
	}

	// *** Class: PathSegment.CubicBezierBy ***

	PathSegment.CubicBezierBy = class extends PathSegment {
		constructor(dim, dim1, dim2) {
			super();

			this.dim = dim;
			this.dim1 = dim1;
			this.dim2 = dim2;
		}

		command(pos) {
			return 'c ' + this.dim1.cx + ' ' + this.dim1.cy + ', ' + this.dim2.cx + ' ' + this.dim2.cy + ', ' + this.dim.cx + ' ' + this.dim.cy;
		}

		newPos(pos) {
			return { x: (pos.x + this.dim.cx), y: (pos.y + this.dim.cy) };
		}
	}

	// *** Class: PathSegment.CubicBezierTo ***

	PathSegment.CubicBezierTo = class extends PathSegment {
		constructor(toPos, pt1, pt2) {
			super();

			this.pt1 = pt1;
			this.pt2 = pt2;
			this.toPos = toPos;
		}

		command(pos) {
			return 'C ' + this.pt1.x + ' ' + this.pt1.y + ', ' + this.pt2.x + ' ' + this.pt2.y + ', ' + this.toPos.x + ' ' + this.toPos.y;
		}

		newPos(pos) {
			return { x: this.toPos.x, y: this.toPos.y };
		}
	}

	function createBottomTabSegments(settings, toPos) {
		var cornerRadius = settings.cornerRadius,
			length = settings.length,
			taperWidth = settings.taperWidth;

		var segments = [];

		segments.push(new PathSegment.LineBy({ cx: -(length - (cornerRadius - taperWidth)), cy: -taperWidth }));

		if (cornerRadius > 0) {
			segments.push(new PathSegment.ArcBy(
				{ cx: -(cornerRadius - taperWidth), cy: -cornerRadius },
				{ rx: cornerRadius, ry: cornerRadius },
				1));
		}

		segments.push(new PathSegment.VLineTo(toPos.y + (taperWidth + cornerRadius)));

		if (cornerRadius > 0) {
			segments.push(new PathSegment.ArcBy(
				{ cx: (cornerRadius - taperWidth), cy: -cornerRadius },
				{ rx: cornerRadius, ry: cornerRadius },
				1));
		}

		segments.push(new PathSegment.LineTo(toPos));

		return segments;
	}
	
	function createTopTabSegments(settings, fromPos, toPos) {
		var catchLength = settings.catchLength,
			cornerRadius = settings.cornerRadius,
			curveLength = settings.curveLength,
			length = settings.length,
			taperType = settings.taperType,
			taperWidth = settings.taperWidth;

		var isSCurveTaper = (taperWidth > 0) && (taperType === tuckbox.TAPER_TYPES.S_CURVE);

		var segments = [];

		segments.push(new PathSegment.HLineBy(length - cornerRadius));

		if (cornerRadius > 0) {
			segments.push(new PathSegment.ArcBy(
				{ cx: cornerRadius, cy: cornerRadius },
				{ rx: cornerRadius, ry: cornerRadius },
				1));
		}

		segments.push(new PathSegment.VLineTo(toPos.y - taperWidth - cornerRadius));

		if (cornerRadius > 0) {
			segments.push(new PathSegment.ArcBy(
				{ cx: -(cornerRadius - (isSCurveTaper ? 0 : taperWidth)), cy: cornerRadius },
				{ rx: cornerRadius, ry: cornerRadius },
				1));
		}

		if (isSCurveTaper) {
			var leftOverLength = length - catchLength - curveLength - cornerRadius;

			if (leftOverLength > 0) {
				segments.push(new PathSegment.HLineBy(-leftOverLength));
			}

			if (curveLength > taperWidth) {
				var halfCurveLength = curveLength / 2,
					halfCurveWidth = taperWidth / 2;

				segments.push(new PathSegment.CubicBezierBy(
					{ cx: -halfCurveLength, cy: halfCurveWidth },
					{ cx: 0, cy: 0 },
					{ cx: -(halfCurveLength - halfCurveWidth), cy: 0 }));

				segments.push(new PathSegment.CubicBezierBy(
					{ cx: -halfCurveLength, cy: halfCurveWidth },
					{ cx: -halfCurveWidth, cy: halfCurveWidth },
					{ cx: 0, cy: 0 }));
			} else {
				segments.push(new PathSegment.LineBy({ cx: -curveLength, cy: taperWidth }));
			}

			if (catchLength > 0) {
				segments.push(new PathSegment.HLineBy(-catchLength));
			}
		}

		segments.push(new PathSegment.LineTo({ x: toPos.x, y: toPos.y }));

		return segments;
	};
	
	function createTopTabSegments2(settings, fromPos, toPos) {
		var catchLength = settings.catchLength,
			cornerRadius = settings.cornerRadius,
			curveLength = settings.curveLength,
			length = settings.length,
			taperType = settings.taperType,
			taperWidth = settings.taperWidth;

		var isSCurveTaper = (taperWidth > 0) && (taperType === tuckbox.TAPER_TYPES.S_CURVE);

		var segments = [];

		if (isSCurveTaper) {
			var leftOverLength = length - catchLength - curveLength - cornerRadius;

			if (catchLength > 0) {
				segments.push(new PathSegment.HLineBy(catchLength));
			}

			if (curveLength > taperWidth) {
				var halfCurveLength = curveLength / 2,
					halfCurveWidth = taperWidth / 2;

				segments.push(new PathSegment.CubicBezierBy(
					{ cx: halfCurveLength, cy: halfCurveWidth },
					{ cx: 0, cy: 0 },
					{ cx: (halfCurveLength - halfCurveWidth), cy: 0 }));

				segments.push(new PathSegment.CubicBezierBy(
					{ cx: halfCurveLength, cy: halfCurveWidth },
					{ cx: halfCurveWidth, cy: halfCurveWidth },
					{ cx: 0, cy: 0 }));
			} else {
				segments.push(new PathSegment.LineBy({ cx: curveLength, cy: taperWidth }));
			}

			if (leftOverLength > 0) {
				segments.push(new PathSegment.HLineBy(leftOverLength));
			}
		} else {
			segments.push(new PathSegment.LineBy({ cx: (length - (cornerRadius - (isSCurveTaper ? 0 : taperWidth))), cy: taperWidth }));
		}

		if (cornerRadius > 0) {
			segments.push(new PathSegment.ArcBy(
				{ cx: (cornerRadius - (isSCurveTaper ? 0 : taperWidth)), cy: cornerRadius },
				{ rx: cornerRadius, ry: cornerRadius },
				1));
		}

		segments.push(new PathSegment.VLineTo(toPos.y - cornerRadius));

		if (cornerRadius > 0) {
			segments.push(new PathSegment.ArcBy(
				{ cx: -cornerRadius, cy: cornerRadius },
				{ rx: cornerRadius, ry: cornerRadius },
				1));
		}

		segments.push(new PathSegment.HLineBy(-(length - cornerRadius)));

		segments.push(new PathSegment.LineTo({ x: toPos.x, y: toPos.y }));

		return segments;
	};

	// *** Class: DrawingTool ***
	
	class DrawingTool {
		constructor(idPrefix) {
			this.idPrefix = idPrefix;
			
			this._idIndex = 0;
			this.pos = null;
		}

		_nextId() {
			return this.idPrefix + '-' + this._idIndex++;
		}

		setPos(x, y) {
			this.pos = new Pos(x, y);
			return this;
		}

		createPath(segments, attrs) {
			var commands = PathSegment.createCommands(this.pos, segments, {
				setPos: $.proxy(function(pos) {
					this.pos = pos;
				}, this)
			});

			var path = new Element('path');

			path.setAttr('id', this._nextId());
			path.setAttr('d', commands);
			path.setAttr('style', this.style);

			if (attrs) {
				$.each(attrs, function(name, value) {
					path.setAttr(name, value);
				});
			}

			return path;
		}
	}

	// *** Class: Brush ***

	class Brush extends DrawingTool {
		constructor(idPrefix, color) {
			super(idPrefix);
			
			this.style = styleMapToString(createBrushStyleMap(color));
		}

		createRect(x1, y1, x2, y2) {
			return new Element('rect')
				.setAttr('style', this.style)
				.setAttr('x', x1)
				.setAttr('y', y1)
				.setAttr('width', x2 - x1)
				.setAttr('height', y2 - y1);
		}
	};

	// *** Class: Pen ***

	class Pen extends DrawingTool {
		constructor(idPrefix, width, color) {
			super(idPrefix);
			
			this.style = styleMapToString(createPenStyleMap(width, color));
		}

		createCirclePath(radius) {
			return this.createPath([
				new PathSegment.MoveTo({ x: this.pos.x - radius, y: this.pos.y}),
				new PathSegment.ArcTo({ x: this.pos.x + radius, y: this.pos.y }, { rx: radius, ry: radius }, 1),
				new PathSegment.ArcTo({ x: this.pos.x - radius, y: this.pos.y }, { rx: radius, ry: radius }, 1)
			]);
		}

		createHorizLinePath(toX) {
			return this.createPath(new PathSegment.HLineTo(toX));
		}

		createVertLinePath(toY) {
			return this.createPath(new PathSegment.VLineTo(toY));
		}
	};

	// *** ++++++++++++ ***

	function createSvgElement(id, paper, docUnits, title) {

		function createDefsElement(id) {
			return new Element('defs').setAttr('id', id);
		}

		function createMetadataElement(id, title) {
			var metadata = new Element('metadata').setAttr('id', id);

			var ccWork = metadata.addNewChild('rdf:RDF').addNewChild('cc:Work').setAttr('rdf:about', '');

			ccWork.addNewChild('dc:format').setText('image/svg+xml');
			ccWork.addNewChild('dc:type').setAttr('rdf:resource', 'http://purl.org/dc/dcmitype/StillImage');
			ccWork.addNewChild('dc:title').setText(title);

			return metadata;
		}

		function createSodipodiElement(id) {
			return new Element('sodipodi:namedview')
				.setAttr('id', id)
				.setAttr('inkscape:document-units', docUnits.abbrev);
		}

		function getViewBox(paper) {
			return '0 0 ' + Units.MM.convert(paper.width, paper.units) + ' ' + Units.MM.convert(paper.height, paper.units);
		}

		return new Element('svg')
			.setAttr('xmlns:dc', 'http://purl.org/dc/elements/1.1/')
			.setAttr('xmlns:cc', 'http://creativecommons.org/ns#')
			.setAttr('xmlns:rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
			.setAttr('xmlns:svg', 'http://www.w3.org/2000/svg')
			.setAttr('xmlns', 'http://www.w3.org/2000/svg')
			.setAttr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
			.setAttr('xmlns:inkscape', 'http://www.inkscape.org/namespaces/inkscape')
			.setAttr('id', id)
			.setAttr('version', '1.1')
			.setAttr('viewBox', getViewBox(paper))
			.setAttr('height', paper.height + paper.units.abbrev)
			.setAttr('width', paper.width + paper.units.abbrev)
			.setAttr('units', paper.units.abbrev)
			.setAttr('inkscape:document-units', docUnits.abbrev)
			.addChildren(
				createSodipodiElement('namedview64'),
				createDefsElement('defs-0'),
				createMetadataElement('metadata-0', title));
	}

	function createLayerElement(id, title, options) {
		title = title || id;
		options = options || {};
		return new Element('g')
			.setAttr('id', id)
			.setAttr('style', 'display:' + (!!options.hidden ? 'none': 'inline'))
			.setAttr('inkscape:groupmode', 'layer')
			.setAttr('inkscape:label', title);
	}

	// *** tuckbox ***

	var tuckbox = {
		TAPER_TYPES: {
			SIMPLE: 0,
			S_CURVE: 1
		},

		createDoc: function(
			paper, // height: Number, units: Units, width: Number
			margin, // bottom: Number, left: Number, right: Number, top: Number
			docUnits,
			card, // height: Number, depth: Number, width: Number
			insideBuffer, // depth: Number, height: Number, width: Number
			materialThickness,
			topFlapTongue, // curveWidth: Number, length: Number
			sideFlap, // gap: Number, taperWidth: Number
			bottomFlap, // gap: Number, taperWidth: Number
			topTab, // catchLength: Number, cornerRadius: Number, curveLength: Number, length: Number, taperType: xxxxx, taperWidth: Number
			bottomTab, // cornerRadius: Number, length: Number, taperWidth: Number
			backSlits, // length: Number
			lockSlits, // length: Number
			thumbNotch, // radius: Number
			background // color: String
		) {
			var userUnits = Units.MM;

			var startPos = {
				x: userUnits.convert(margin.left, paper.units),
				y: userUnits.convert(margin.top, paper.units)
			};

			var box = {
				backWidth: card.width + insideBuffer.width,
				frontWidth: card.width + insideBuffer.width + materialThickness,
				height: card.height + insideBuffer.height,
				depth: card.depth + insideBuffer.depth
			};

			var imageWidth = Math.max(box.depth, bottomTab.length)
				+ box.height
				+ Math.max(box.depth + topFlapTongue.length, topTab.length);

			var imageHeight = box.backWidth + box.frontWidth + (3 * box.depth) - sideFlap.gap;

			var guideLength = 5;
			var guideGap = 2;

			var guideBox = {
				left: startPos.x,
				right: startPos.x + imageWidth + 2 * (guideLength + guideGap),
				top: startPos.y,
				bottom: startPos.y + imageHeight + 2 * (guideLength + guideGap)
			};

			var imagePos = {
				x: Math.ceil(guideBox.left + guideLength + guideGap),
				y: Math.ceil(guideBox.top + guideLength + guideGap)
			};

			imagePos.x = Math.ceil(imagePos.x);
			imagePos.y = Math.ceil(imagePos.y);

			if (bottomTab.length > box.depth) {
				imagePos.x += bottomTab.length - box.depth;
			}

			var x1 = imagePos.x,
				x2 = x1 + box.depth,
				x3 = x2 + box.height,
				x4 = x3 + box.depth,
				x5 = x4 + topFlapTongue.length;

			var y1 = imagePos.y,
				y2 = y1 + box.depth,
				y3 = y2 + box.backWidth,
				y4 = y3 + box.depth,
				y5 = y4 + box.frontWidth,
				y6 = y5 + box.depth - sideFlap.gap;

			var adjustedX1 = x2 - Math.max(box.depth, bottomTab.length);
				adjustedX5 = x3 + Math.max(box.depth + topFlapTongue.length, topTab.length);

			var svg = createSvgElement('doc-tuckbox', paper, docUnits, 'Tuck Box SVG');

			// ***
			// *** Background Layer
			// ***

			if (background && background.color) {
				var bgBleed = background.bleed;

				var backgroundLayer = svg.addChild(createLayerElement('layer-background', 'Background'));

				var bgBrush = new Brush('background', background.color);

				bgBrush.setPos(x1 - bgBleed, y1 - bgBleed);

				var pathSegments = [];

				pathSegments.push(new PathSegment.HLineTo(x3 + bgBleed));
				pathSegments.push(new PathSegment.VLineTo(y2 - bgBleed));
				pathSegments.push(new PathSegment.HLineTo(x5 + bgBleed));
				pathSegments.push(new PathSegment.VLineTo(y3 + bgBleed));
				pathSegments.push(new PathSegment.HLineTo(x3 + topTab.length + bgBleed));
				pathSegments.push(new PathSegment.VLineTo(y4 + bgBleed));
				pathSegments.push(new PathSegment.HLineTo(x3 + bgBleed));
				pathSegments.push(new PathSegment.VLineTo(y5 - bgBleed));
				pathSegments.push(new PathSegment.HLineTo(x3 + topTab.length + bgBleed));
				pathSegments.push(new PathSegment.VLineTo(y6 + bgBleed));
				pathSegments.push(new PathSegment.HLineTo(x2 - bgBleed));
				pathSegments.push(new PathSegment.VLineTo(y5 + bgBleed));
				pathSegments.push(new PathSegment.HLineTo(x1 - bgBleed));
				pathSegments.push(new PathSegment.VLineTo(y1 - bgBleed));

				backgroundLayer.addChildren(bgBrush.createPath(pathSegments));
			}

			// ***
			// *** Outline Layer
			// ***

			var tongueRadii = { rx: topFlapTongue.length, ry: topFlapTongue.curveWidth };

			var outlineLayer = svg.addChild(createLayerElement('layer-outline', 'Outline'));

			var outlinePen = new Pen('outline', outlineSettings.pen.width, outlineSettings.pen.color);

			outlinePen.setPos(x2, y1);

			var pathSegments = [];

			pathSegments.push(new PathSegment.HLineTo(x3));
			pathSegments.push(new PathSegment.VLineTo(y2));

			if (backSlits.length > 0) {
				pathSegments.push(new PathSegment.HLineTo(x3 - backSlits.length));
				pathSegments.push(new PathSegment.HLineTo(x3));
			}

			pathSegments.push(new PathSegment.HLineTo(x4));
			pathSegments.push(new PathSegment.ArcTo({ x: x5, y: y2 + topFlapTongue.curveWidth }, tongueRadii, 1));
			pathSegments.push(new PathSegment.VLineTo(y3 - topFlapTongue.curveWidth));
			pathSegments.push(new PathSegment.ArcTo({ x: x4, y: y3 }, tongueRadii, 1));
			pathSegments.push(new PathSegment.HLineTo(x3));

			if (backSlits.length > 0) {
				pathSegments.push(new PathSegment.HLineTo(x3 - backSlits.length));
				pathSegments.push(new PathSegment.HLineTo(x3));
			}

			pathSegments.push(new PathSegment.VLineTo(y3 + sideFlap.gap));
			pathSegments.push.apply(pathSegments, createTopTabSegments(topTab, { x: x3, y: y3 + sideFlap.gap }, { x: x3, y: y4 }));
			pathSegments.push(new PathSegment.VLineTo(y5));
			pathSegments.push.apply(pathSegments, createTopTabSegments2(topTab, { x: x3, y: y5 }, { x: x3, y: y6 }));
			pathSegments.push(new PathSegment.HLineTo(x2 + sideFlap.taperWidth));
			pathSegments.push(new PathSegment.LineTo({ x: x2, y: y5 }));
			pathSegments.push(new PathSegment.LineTo({ x: x1 + bottomFlap.gap, y: y5 - bottomFlap.taperWidth }));
			pathSegments.push(new PathSegment.VLineTo(y4 + bottomFlap.taperWidth));
			pathSegments.push(new PathSegment.LineTo({ x: x2, y: y4 }));
			pathSegments.push.apply(pathSegments, createBottomTabSegments(bottomTab, { x: x2, y: y3 }));
			pathSegments.push(new PathSegment.HLineTo(x1));
			pathSegments.push(new PathSegment.VLineTo(y2));
			pathSegments.push(new PathSegment.HLineTo(x2));
			pathSegments.push.apply(pathSegments, createBottomTabSegments(bottomTab, { x: x2, y: y1 }));

			outlineLayer.addChildren(outlinePen.createPath(pathSegments));

			// ***
			// *** Alignment Layer
			// ***

			var alignmentLayer = svg.addChild(createLayerElement('layer-alignment', 'Alignment', { hidden: true }));

			var alignmentBrush1 = new Brush('alignment1', '#cccccc'),
				alignmentBrush2 = new Brush('alignment2', '#aaaaaa');

			alignmentLayer.addChildren(
				alignmentBrush1.createRect(x1, y2, x2, y3), // Bottom
				alignmentBrush1.createRect(x1, y4, x2, y5), // Bottom Flap
				alignmentBrush1.createRect(x2, y1, x3, y2), // Side
				alignmentBrush1.createRect(x2, y3, x3, y4), // Side
				alignmentBrush1.createRect(x2, y5, x3, y6 + sideFlap.gap), // Side flap
				alignmentBrush1.createRect(x3, y2, x4, y3), // Top
				alignmentBrush2.createRect(x2, y2, x3, y3), // Back
				alignmentBrush2.createRect(x2, y4, x3, y5), // Front
				alignmentBrush2.createRect(x4, y2, x5, y3)); // Tongue

			// ***
			// *** Artwork Layer
			// ***

			var artworkLayer = svg.addChild(createLayerElement('layer-artwork', 'Artwork'));

			// ***
			// *** Guide Layer
			// ***

			var guideLayer = svg.addChild(createLayerElement('layer-guide', 'Guide'));

			var guidePen = new Pen('guide', outlineSettings.pen.width, outlineSettings.pen.color); // TODO

			guideLayer.addChildren(
				guidePen.setPos(guideBox.left, y1).createHorizLinePath(x2 - bottomTab.length - guideGap),
				guidePen.setPos(guideBox.left, y2).createHorizLinePath(adjustedX1 - guideGap),
				guidePen.setPos(guideBox.left, y3).createHorizLinePath(adjustedX1 - guideGap),
				guidePen.setPos(guideBox.left, y4).createHorizLinePath(Math.min(x1 + bottomFlap.gap, x2 - bottomTab.length) - guideGap),
				guidePen.setPos(guideBox.left, y5).createHorizLinePath(x1 + bottomFlap.gap - guideGap),
				guidePen.setPos(guideBox.left, y6).createHorizLinePath(x2 + sideFlap.taperWidth - guideGap),
				guidePen.setPos(guideBox.right, y1).createHorizLinePath(x3 + guideGap),
				guidePen.setPos(guideBox.right, y2).createHorizLinePath(x5 + guideGap),
				guidePen.setPos(guideBox.right, y3).createHorizLinePath(adjustedX5 + guideGap),
				guidePen.setPos(guideBox.right, y4).createHorizLinePath(x3 + topTab.length + guideGap),
				guidePen.setPos(guideBox.right, y5).createHorizLinePath(x3 + topTab.length + guideGap),
				guidePen.setPos(guideBox.right, y6).createHorizLinePath(x3 + topTab.length + guideGap),

				guidePen.setPos(x1, guideBox.top).createVertLinePath(y1 - guideGap),
				guidePen.setPos(x2, guideBox.top).createVertLinePath(y1 - guideGap),
				guidePen.setPos(x3, guideBox.top).createVertLinePath(y1 - guideGap),
				guidePen.setPos(x4, guideBox.top).createVertLinePath(y2 - guideGap),
				guidePen.setPos(x5, guideBox.top).createVertLinePath(y2 - guideGap),

				guidePen.setPos(x1, guideBox.bottom).createVertLinePath(y5 + guideGap),
				guidePen.setPos(x2, guideBox.bottom).createVertLinePath(y6 + guideGap),
				guidePen.setPos(x3, guideBox.bottom).createVertLinePath(y6 + guideGap),
				guidePen.setPos(x4, guideBox.bottom).createVertLinePath(y3 + guideGap),
				guidePen.setPos(x5, guideBox.bottom).createVertLinePath(y3 + guideGap)
			);

			if (backSlits.length > 0) {
				guideLayer.addChildren(
					guidePen.setPos(x3 - backSlits.length, guideBox.top).createVertLinePath(y1 - guideGap),
					guidePen.setPos(x3 - backSlits.length, guideBox.bottom).createVertLinePath(y6 + guideGap)
				);
			}

			if (bottomFlap.gap > 0) {
				guideLayer.addChildren(
					guidePen.setPos(x1 + bottomFlap.gap, guideBox.top).createVertLinePath(y1 - guideGap),
					guidePen.setPos(x1 + bottomFlap.gap, guideBox.bottom).createVertLinePath(y5 + guideGap)
				);
			}

			if (thumbNotch.radius > 0) {
				outlinePen.setPos(x3 + thumbNotch.offset, (y4 + y5) / 2);

				guideLayer.addChildren(outlinePen.createCirclePath(thumbNotch.radius));
			}

			return '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svg.toString();
		}
	};

	// *** Global Scope ***

	window.tuckbox = tuckbox;
	window.Units = Units;

})(window, jQuery);
