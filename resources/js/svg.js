// *** SVG Library ***

(function(window, undefined) {

	const INDENT = '  ',
		ATTR_INDENT = '   ';

	// *** Private Functions ***

	function repeatString(s, times) {
		let text = '';
		for (let i = 0; i < times; i++) {
			text += s;
		}
		return text;
	}

	function styleMapToString(styleMap) {
		const tokens = [];
		for (const [name, value] of Object.entries(styleMap)) {
			tokens.push(name + ':' + value);
		}
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

	// *** Class: DrawingTool ***
	
	class DrawingTool {
		constructor(idPrefix) {
			this.idPrefix = idPrefix;
			
			this._idIndex = 0;
		}

		_nextId() {
			return this.idPrefix + '-' + this._idIndex++;
		}

		createPathElementForSegments(segments, attrs) {
			const commands = PathSegment.createCommands(segments);

			return this.createPathElementFromCommands(commands, attrs);
		}

		createPathElementFromCommands(commands, attrs) {
			const path = new Element('path');

			path.setAttr('id', this._nextId());
			path.setAttr('d', commands);
			path.setAttr('style', this.style);

			if (attrs) {
				for (const [name, value] of Object.entries(attrs)) {
					path.setAttr(name, value);
				}
			}

			return path;
		}
	}

	// *** Class: Pen ***

	class Pen extends DrawingTool {
		constructor(idPrefix, width, color) {
			super(idPrefix);
			
			this.style = styleMapToString(createPenStyleMap(width, color));
		}

		createCircleElement(origin, radius) {
			return new Element('circle')
				.setAttr('style', this.style)
				.setAttr('cx', origin.x)
				.setAttr('cy', origin.y)
				.setAttr('r', radius);
		}

		createCirclePathElement(origin, radius) {
			return new Path({ x: origin.x - radius, y: origin.y })
				.addArcTo({ x: origin.x + radius, y: origin.y }, { rx: radius, ry: radius }, 1)
				.addArcTo({ x: origin.x - radius, y: origin.y }, { rx: radius, ry: radius }, 1)
				.createElement(this);
		}

		createLineElement(pos1, pos2) {
			return new Element('line')
				.setAttr('style', this.style)
				.setAttr('x1', pos1.x)
				.setAttr('y1', pos1.y)
				.setAttr('x2', pos2.x)
				.setAttr('y2', pos2.y);
		}

		createHLineElement(y, fromX, toX) {
			return this.createLineElement({ x: fromX, y: y }, { x: toX, y: y });
		}

		createVLineElement(x, fromY, toY) {
			return this.createLineElement({ x: x, y: fromY }, { x: x, y: toY });
		}

		createHLinePathElement(y, fromX, toX) {
			return new Path({ x: fromX, y: y })
				.addHLineTo(toX)
				.createElement(this);
		}

		createVLinePathElement(x, fromY, toY) {
			return new Path({ x: x, y: fromY })
				.addVLineTo(toY)
				.createElement(this);
		}
	};

	// *** Class: Brush ***

	class Brush extends DrawingTool {
		constructor(idPrefix, color) {
			super(idPrefix);
			
			this.style = styleMapToString(createBrushStyleMap(color));
		}

		createRectElement(x1, y1, x2, y2) {
			return new Element('rect')
				.setAttr('style', this.style)
				.setAttr('x', x1)
				.setAttr('y', y1)
				.setAttr('width', x2 - x1)
				.setAttr('height', y2 - y1);
		}
	};

	// *** Class: Element ***

	class Element {
		constructor(name) {
			this.attrs = {};
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
			this.attrs[name] = value;
			return this;
		}

		setAttrs(attrMap) {
			for (const [name, value] of Object.entries(attrMap)) {
				this.attrs[name] = value;
			}
			return this;
		}

		setText(text) {
			this.text = text;
			return this;
		}

		toString(level) {
			level = level || 0;

			const indent = repeatString(INDENT, level);
			
			let text = indent + '<' + this.name;

			if (Object.keys(this.attrs).length > 0) {
				for (const [name, value] of Object.entries(this.attrs)) {
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
		segments = Array.isArray(segments) ? segments : [segments];

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

	function Path(startPos) {
		this.segments = [];

		if (startPos) {
			this.segments.push(new PathSegment.MoveTo(startPos));
		}
	}

	Path.prototype = {
		add: function(pathOrSegments) {
			const segmentsToAdd = (pathOrSegments instanceof Path)
				? pathOrSegments.segments
				: Array.isArray(pathOrSegments) ? pathOrSegments : [pathOrSegments];

			this.segments.push.apply(this.segments, segmentsToAdd);
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
					halfCx = cx / 2,
					halfCy = cy / 2;

				this.addCubicBezierBy(
					{ cx: halfCx, cy: halfCy },
					{ cx: 0, cy: 0 },
					{ cx: halfCx - (cxSign * halfCy), cy: 0 });

				this.addCubicBezierBy(
					{ cx: halfCx, cy: halfCy },
					{ cx: cxSign * halfCy, cy: halfCy },
					{ cx: 0, cy: 0 });
			} else {
				this.addLineBy({ cx: cx, cy: cy });
			}

			return this;
		},

		createCommands() {
			return PathSegment.createCommands(this.segments);
		},

		createElement(drawingTool, attrs) {
			return drawingTool.createPathElementForSegments(this.segments, attrs);
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
