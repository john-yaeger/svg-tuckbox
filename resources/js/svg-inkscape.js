// *** SVG Inkscape Library ***

(function(window, undefined) {

	const XML_DECLARATION = Svg.createXmlDeclaration('"1.0', 'UTF-8', false);

	// *** Enum: Units ***

	class Units {
		static INCHES = new Units('INCHES', 'Inches', 'in', 1000, { MM: { n: 254, d: 10 } });
		static MM = new Units('MM', 'Millimeters', 'mm', 10, { INCHES: { n: 10, d: 254 } });

		static fromId = function(id) {
			switch(id) {
				case Units.INCHES.id: return Units.INCHES;
				case Units.MM.id: return Units.MM;
			}
		};

		constructor(id, name, abbrev, round, conversionScales) {
			this.id = id;
			this.name = name;
			this.abbrev = abbrev;
			this.round = round;
			this.conversionScales = conversionScales;
		}

		convert(value, fromUnits) {
			if (this !== fromUnits) {
				const scale = fromUnits.conversionScales[this.id];
				return Math.round((value * scale.n * this.round) / scale.d) / this.round;
			}
			return value;
		}
	}

	// *** Private Functions ***

	function createDefsElement(id) {
		return new Svg.Element('defs').setAttr('id', id);
	}

	function createMetadataElement(id, title) {
		const metadata = new Svg.Element('metadata').setAttr('id', id);

		const ccWork = metadata.addNewChild('rdf:RDF').addNewChild('cc:Work').setAttr('rdf:about', '');

		ccWork.addNewChild('dc:format').setText('image/svg+xml');
		ccWork.addNewChild('dc:type').setAttr('rdf:resource', 'http://purl.org/dc/dcmitype/StillImage');
		ccWork.addNewChild('dc:title').setText(title);

		return metadata;
	}

	function createSodipodiElement(id, docUnits) {
		return new Svg.Element('sodipodi:namedview')
			.setAttr('id', id)
			.setAttr('inkscape:document-units', docUnits.abbrev);
	}

	function getViewBox(paper) {
		return '0 0 ' + Units.MM.convert(paper.width, paper.units) + ' ' + Units.MM.convert(paper.height, paper.units);
	}

	// *** Public Functions ***

	function createLayerElement(id, title, options) {
		title = title || id;
		options = options || {};
		return new Svg.Element('g')
			.addAttrs({
				'id': id,
				'style': 'display:' + (!!options.hidden ? 'none': 'inline'),
				'inkscape:groupmode': 'layer',
				'inkscape:label': title });
	}

	function createSvgElement(id, paper, docUnits, title) {
		return new Svg.Element('svg')
			.addAttrs({
				'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
				'xmlns:cc': 'http://creativecommons.org/ns#',
				'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
				'xmlns:svg': 'http://www.w3.org/2000/svg',
				'xmlns': 'http://www.w3.org/2000/svg',
				'xmlns:xlink': 'http://www.w3.org/1999/xlink',
				'xmlns:inkscape': 'http://www.inkscape.org/namespaces/inkscape',
				'id': id,
				'version': '1.1',
				'viewBox': getViewBox(paper),
				'height': paper.height + paper.units.abbrev,
				'width': paper.width + paper.units.abbrev,
				'units': paper.units.abbrev,
				'inkscape:document-units': docUnits.abbrev })
			.addChildren(
				createSodipodiElement('namedview64', docUnits),
				createDefsElement('defs-0'),
				createMetadataElement('metadata-0', title));
	}

	// *** Class: Document ***

	class Document {
		constructor(id, paper, docUnits, title) {
			this.svgElement = createSvgElement(id, paper, docUnits, title);
		}

		addChild(/* element */ ...args) {
			return this.svgElement.addChild(...args);
		}

		addChildren(/* element... */ ...args) {
			return this.svgElement.addChildren(...args);
		}

		addNewChild(/* name */ ...args) {
			return this.svgElement.addNewChild(...args);
		}

		toString() {
			return XML_DECLARATION + '\n' + this.svgElement.toString();
		}
	}

	// *** Global Scope ***

	window.Svg.Inkscape = {
		XML_DECLARATION: XML_DECLARATION,
		createLayerElement: createLayerElement,
		createSvgElement: createSvgElement,
		Document: Document
	};

	window.Units = Units;

})(window);
