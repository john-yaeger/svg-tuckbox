// *** Utils Library ***

(function(window, undefined) {

	function extend(/* object... */) {
		for (let i = 1; i < arguments.length; i++) {
			for (let key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					arguments[0][key] = arguments[i][key];
				}
			}
		}
		return arguments[0];
	}

	function forceArray(arg) {
		return Array.isArray(arg) ? arg : [arg];
	}

	function repeatString(s, times) {
		let text = '';
		for (let i = 0; i < times; i++) {
			text += s;
		}
		return text;
	}

	function saveFile(filename, type, data) {
		const file = new Blob([data], { type: type });

		if (navigator.msSaveOrOpenBlob) // IE10+
			navigator.msSaveOrOpenBlob(file, filename);
		else { // Others
			const a = document.createElement('a'),
					url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;

			document.body.appendChild(a);
			a.click();
			setTimeout(function() {
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}, 0);
		}
	}

	// *** Global Scope ***

	window.Utils = {
		extend: extend,
		forceArray: forceArray,
		repeatString: repeatString,
		saveFile: saveFile
	};

})(window);
