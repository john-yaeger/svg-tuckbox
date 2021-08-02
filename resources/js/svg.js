// *** SVG Library ***

(function(window, undefined) {

	const INDENT = '  ',
		ATTR_INDENT = '   ';

	// *** Private Functions ***

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

	function getSegments(pathOrSegments) {
		return (pathOrSegments instanceof Path)
			? pathOrSegments.segments
			: forceArray(pathOrSegments);
	}

	function styleMapToString(styleMap) {
		const tokens = [];
		for (const [name, value] of Object.entries(styleMap)) {
			tokens.push(name + ':' + value);
		}
		return tokens.join(';');
	}

	// *** Public Functions ***

	function createXmlDeclaration(version, encoding, isStandalone) {
		return '<?xml version="' + version + '" encoding="' + encoding + '" standalone="' + (isStandalone ? 'yes' : 'no') + '"?>';
	}

	// *** Class: Pos ***

	function Pos(x, y) {
		this.x = x;
		this.y = y;
	}

	Pos.clone = function(pos) {
		return new Pos(pos.x, pos.y);
	};

	Pos.midPoint = function(pos1, pos2) {
		return new Pos((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);
	};

	// *** Class: Element ***

	class Element {
		constructor(name) {
			this.attrMap = {};
			this.children = [];
			this.name = name;
			this.text = null;
		}

		addChild(element) {
			this.children.push(element);
			return element;
		}

		addChildren(/* element... */) {
			for (const element of arguments) {
				this.addChild(element);
			}
			return this;
		}

		addNewChild(name) {
			return this.addChild(new Element(name));
		}

		setAttr(name, value) {
			this.attrMap[name] = value;
			return this;
		}

		addAttrs(attrMap) {
			extend(this.attrMap, attrMap);
			return this;
		}

		setText(text) {
			this.text = text;
			return this;
		}

		toString(level = 0) {
			const indent = repeatString(INDENT, level);

			let text = indent + '<' + this.name;

			if (Object.keys(this.attrMap).length > 0) {
				for (const [name, value] of Object.entries(this.attrMap)) {
					text += '\n' + indent + ATTR_INDENT + name + '="' + value + '"';
				}
			}

			if (this.children.length > 0) {
				text += '>\n';
				for (const child of this.children) {
					text += child.toString(level + 1) + '\n';
				}
				text += indent + '</' + this.name + '>';
			} else if (this.text != null) {
				text += '>' + this.text + '</' + this.name + '>';
			} else {
				text += ' />';
			}

			return text;
		}
	}

	Element.createStyled = function(name, styleMap, attrMap, /*optional*/ optionalAttrMap) {
		return new Element(name)
			.setAttr('style', styleMapToString(styleMap))
			.addAttrs(extend(attrMap, optionalAttrMap));
	}

	Element.createLine = function(pos1, pos2, styleMap, /*optional*/ attrMap) {
		return Element.createStyled('line', styleMap, {
				'x1': pos1.x,
				'y1': pos1.y,
				'x2': pos2.x,
				'y2': pos2.y
			}, attrMap);
	}

	Element.createHLine = function(y, fromX, toX, styleMap, /*optional*/ attrMap) {
		return Element.createLine({ x: fromX, y: y }, { x: toX, y: y }, styleMap, attrMap);
	}

	Element.createVLine = function(x, fromY, toY, styleMap, /*optional*/ attrMap) {
		return Element.createLine({ x: x, y: fromY }, { x: x, y: toY }, styleMap, attrMap);
	}

	Element.createCircle = function(origin, radius, styleMap, /*optional*/ attrMap) {
		return Element.createStyled('circle', styleMap, {
				'cx': origin.x,
				'cy': origin.y,
				'r': radius
			}, attrMap);
	}

	Element.createRect = function(x1, y1, x2, y2, styleMap, /*optional*/ attrMap) {
		return Element.createStyled('rect', styleMap, {
				'x': x1,
				'y': y1,
				'width': x2 - x1,
				'height': y2 - y1
			}, attrMap);
	}

	Element.createPath = function(pathOrSegments, styleMap, /*optional*/ attrMap) {
		const commands = PathSegment.createCommands(getSegments(pathOrSegments));

		return Element.createPathFromCommands(commands, styleMap, attrMap);
	}

	Element.createPathFromCommands = function(commands, styleMap, /*optional*/ attrMap) {
		return Element.createStyled('path', styleMap, {
				'd': commands
			}, attrMap);
	}

	Element.createStyled = function(name, styleMap, attrMap) {
		return new Element(name)
			.setAttr('style', styleMapToString(styleMap))
			.addAttrs(attrMap);
	}

	// *** Class: DrawingTool ***

	class DrawingTool {
		constructor(styleMap) {
			this.styleMap = styleMap;
		}

		createLineElement(pos1, pos2, /*optional*/ attrMap) {
			return Element.createLine(pos1, pos2, this.styleMap, attrMap);
		}

		createHLineElement(y, fromX, toX, /*optional*/ attrMap) {
			return Element.createHLine(y, fromX, toX, this.styleMap, attrMap);
		}

		createVLineElement(x, fromY, toY, /*optional*/ attrMap) {
			return Element.createVLine(x, fromY, toY, this.styleMap, attrMap);
		}

		createCircleElement(origin, radius, /*optional*/ attrMap) {
			return Element.createCircle(origin, radius, this.styleMap, attrMap);
		}

		createRectElement(x1, y1, x2, y2, attrMap) {
			return Element.createRect(x1, y1, x2, y2, this.styleMap, attrMap);
		}

		createPathElement(path, /*optional*/ attrMap) {
			return Element.createPath(path, this.styleMap, attrMap);
		}
	}

	DrawingTool.createCombinedStyleMap = function(/* drawingTool... */) {
		let styleMaps = Array.from(arguments).map(drawingTool => drawingTool.styleMap);

		return extend({}, ...styleMaps);
	}

	// *** Class: Pen ***

	class Pen extends DrawingTool {
		constructor(width, color) {
			super(Pen.createStyleMap(width, color));
		}
	};

	Pen.createStyleMap = function(width, color, /*optional*/ styleMap) {
		return extend({}, {
				'fill': 'none',
				'stroke': color,
				'stroke-width': width
			}, styleMap );
	}

	// *** Class: Brush ***

	class Brush extends DrawingTool {
		constructor(color) {
			super(Brush.createStyleMap(color));
		}
	};

	Brush.createStyleMap = function(color, /*optional*/ styleMap) {
		return extend({}, {
				'fill': color
			}, styleMap );
	}

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

	PathSegment.createCommands = function(segments) {
		segments = forceArray(segments);

		const commands = [];

		let pos = null;

		for (const segment of segments) {
			commands.push(segment.command(pos));
			pos = segment.newPos(pos);
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

	// *** Class: Path

	function Path(/*optional*/ startPos) {
		this.segments = [];

		if (startPos) {
			this.segments.push(new PathSegment.MoveTo(startPos));
		}
	}

	Path.prototype = {
		add: function(pathOrSegments) {
			this.segments.push.apply(this.segments, getSegments(pathOrSegments));
			return this;
		},

		addMoveTo: function(toPos) {
			return this.add(new PathSegment.MoveTo(toPos));
		},

		addHMoveTo: function(toX) {
			return this.add(new PathSegment.HMoveTo(toX));
		},

		addVMoveTo: function(toY) {
			return this.add(new PathSegment.VMoveTo(toY));
		},

		addLineBy: function(dim) {
			return this.add(new PathSegment.LineBy(dim));
		},

		addHLineBy: function(cx) {
			return this.add(new PathSegment.HLineBy(cx));
		},

		addVLineBy: function(cy) {
			return this.add(new PathSegment.VLineBy(cy));
		},

		addLineTo: function(toPos) {
			return this.add(new PathSegment.LineTo(toPos));
		},

		addHLineTo: function(toX) {
			return this.add(new PathSegment.HLineTo(toX));
		},

		addVLineTo: function(toY) {
			return this.add(new PathSegment.VLineTo(toY));
		},

		addArcBy: function(dim, radii, dir) {
			return this.add(new PathSegment.ArcBy(dim, radii, dir));
		},

		addArcTo: function(toPos, radii, dir) {
			return this.add(new PathSegment.ArcTo(toPos, radii, dir));
		},

		addCubicBezierBy: function(dim, dim1, dim2) {
			return this.add(new PathSegment.CubicBezierBy(dim, dim1, dim2));
		},

		addCubicBezierTo: function(toPos, pt1, pt2) {
			return this.add(new PathSegment.CubicBezierTo(toPos, pt1, pt2));
		},

		addHorizSCurve: function(cx, cy) {
			if (Math.abs(cx) > Math.abs(cy)) {
				const cxSign = Math.sign(cx),
					cySign = Math.sign(cy),
					halfCx = cx / 2,
					halfCy = cy / 2;

				this.addCubicBezierBy(
					{ cx: halfCx, cy: halfCy },
					{ cx: 0, cy: 0 },
					{ cx: halfCx - (cxSign * cySign * halfCy), cy: 0 });

				this.addCubicBezierBy(
					{ cx: halfCx, cy: halfCy },
					{ cx: cxSign * cySign * halfCy, cy: halfCy },
					{ cx: 0, cy: 0 });
			} else {
				this.addLineBy({ cx: cx, cy: cy });
			}

			return this;
		},

		createCommands() {
			return PathSegment.createCommands(this.segments);
		},

		createElement(drawingTools, /*optional*/ attrMap) {
			drawingTools = forceArray(drawingTools);

			const styleMap = DrawingTool.createCombinedStyleMap(...drawingTools);

			return Element.createPath(this.segments, styleMap, attrMap);
		}
	};

	// *** Global Scope ***

	window.Svg = {
		createXmlDeclaration: createXmlDeclaration,
		Pos: Pos,
		DrawingTool: DrawingTool,
		Pen: Pen,
		Brush: Brush,
		Element: Element,
		Path: Path,
		PathSegment: PathSegment
	};

})(window);
