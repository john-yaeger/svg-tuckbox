// *** Tuckbox Library ***

(function(window, undefined) {

	const outlineSettings = {
		pen: {
			width: 0.2,
			color: '#000000'
		}
	}
	
	function reverseDim(dim) {
		return {
			cx: dim.cy,
			cy: dim.cx
		}
	}

	function createTabSidePath(length, dir, xDir, yDir, settings) {
		const taperType = settings.taperType || tuckbox.TAPER_TYPES.LINEAR,
			taperWidth = settings.taperWidth || 0,
			cornerRadius = settings.cornerRadius || 0,
			catchLength = settings.catchLength || 0,
			curveLength = settings.curveLength || 0;

		const taperLength = length - catchLength,
			taperAngle = Math.atan(taperWidth / taperLength);

		let cornerDim = null;

		if (cornerRadius > 0) {
			if ((taperWidth > 0) && (taperType === tuckbox.TAPER_TYPES.LINEAR)) {
				const cornerAngle = (Math.PI / 2) - taperAngle;

				cornerDim = {
					cx: cornerRadius - (cornerRadius * Math.cos(cornerAngle)),
					cy: cornerRadius * Math.sin(cornerAngle)
				};
			} else {
				cornerDim = { cx: cornerRadius, cy: cornerRadius };
			}
		}

		const adjustedTaperLength = (taperLength - (cornerDim ? cornerDim.cx : 0));

		const path = new Svg.Path();
		let deltaY = 0;

		if ((dir < 0) && cornerDim) {
			path.addArcBy(
				reverseDim({ cx: -xDir * cornerDim.cx, cy: yDir * cornerDim.cy }),
				{ rx: cornerRadius, ry: cornerRadius },
				(xDir * yDir > 0) ? 1 : 0);
			deltaY += cornerDim.cy;
		}

		if (taperWidth > 0) {
			if ((dir > 0) && (catchLength > 0)) {
				path.addLineBy(reverseDim({ cx: dir * xDir * catchLength, cy: 0 }));
			}

			if (taperType === tuckbox.TAPER_TYPES.S_CURVE) {
				const leftOverLength = adjustedTaperLength - curveLength;

				if ((dir < 0) && (leftOverLength > 0)) {
					path.addLineBy(reverseDim({ cx: dir * xDir * leftOverLength, cy: 0 }));
				}

				path.addHorizSCurve(dir * xDir * curveLength, yDir * taperWidth); // TODO
				deltaY += taperWidth;

				if ((dir > 0) && (leftOverLength > 0)) {
					path.addLineBy(reverseDim({ cx: dir * xDir * leftOverLength, cy: 0 }));
				}
			} else {
				const lineCy = taperWidth - (cornerDim ? (cornerDim.cx * Math.tan(taperAngle)) : 0);

				path.addLineBy(reverseDim({ cx: dir * xDir * adjustedTaperLength, cy: yDir * lineCy }));
				deltaY += lineCy;
			}

			if ((dir < 0) && (catchLength > 0)) {
				path.addLineBy(reverseDim({ cx: dir * xDir * catchLength, cy: 0 }));
			}
		} else {
			path.addLineBy(reverseDim({ cx: dir * xDir * (length - (cornerDim ? cornerDim.cx : 0)), cy: 0 }));
		}

		if ((dir > 0) && cornerDim) {
			path.addArcBy(
				reverseDim({ cx: xDir * cornerDim.cx, cy: yDir * cornerDim.cy }),
				{ rx: cornerRadius, ry: cornerRadius },
				(xDir * yDir > 0) ? 1 : 0);
			deltaY += cornerDim.cy;
		}

		return [path, deltaY];
	}

	function createTabPath(settings, xDir, yDir, length, toPos) {
		const catchLength = settings.catchLength || 0,
			cornerRadius = settings.cornerRadius || 0,
			curveLength = settings.curveLength || 0,
			taper1Type = settings.taper1Type || settings.taperType || null,
			taper1Width = settings.taper1Width || settings.taperWidth || 0,
			taper2Type = settings.taper2Type || settings.taperType || null,
			taper2Width = settings.taper2Width || settings.taperWidth || 0;

		const [sidePath1, deltaY1] = createTabSidePath(length, 1, xDir, yDir, {
			taperType: taper1Type,
			taperWidth: taper1Width,
			cornerRadius: cornerRadius,
			catchLength: catchLength,
			curveLength: curveLength
		});

		const [sidePath2, deltaY2] = createTabSidePath(length, -1, xDir, yDir, {
			taperType: taper2Type,
			taperWidth: taper2Width,
			cornerRadius: cornerRadius,
			catchLength: catchLength,
			curveLength: curveLength
		});

		return new Svg.Path()
			.add(sidePath1)
			.addLineTo(reverseDim({ cx: 0, cy: toPos.y - (yDir * deltaY2) }))
			.add(sidePath2)
			.addLineTo(toPos);
	}

	// *** tuckbox ***

	const tuckbox = {
		TAPER_TYPES: {
			LINEAR: 1,
			S_CURVE: 2
		},

		createDoc: function(
			paper, // height: Number, units: Units, width: Number
			margin, // bottom: Number, left: Number, right: Number, top: Number
			docUnits,
			guide,
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
			const userUnits = Units.MM;

			const startPos = {
				x: userUnits.convert(margin.left, paper.units),
				y: userUnits.convert(margin.top, paper.units)
			};

			const box = {
				length: 70,
				width: 50,
				height: 20
			};

			const imageWidth = Math.max(box.depth, bottomTab.length)
				+ box.height
				+ Math.max(box.depth + topFlapTongue.length, topTab.length);

			const imageHeight = box.backWidth + box.frontWidth + (3 * box.depth) - sideFlap.gap;

			const guideBox = {
				left: startPos.x,
				right: startPos.x + imageWidth + 2 * (guide.length + guide.gap),
				top: startPos.y,
				bottom: startPos.y + imageHeight + 2 * (guide.length + guide.gap)
			};

			const imagePos = {
				x: Math.ceil(guideBox.left + guide.length + guide.gap),
				y: Math.ceil(guideBox.top + guide.length + guide.gap)
			};

			imagePos.x = Math.ceil(imagePos.x);
			imagePos.y = Math.ceil(imagePos.y);

			if (bottomTab.length > box.depth) {
				imagePos.x += bottomTab.length - box.depth;
			}

			overlap = {
				height: 20
			};

			const x1 = imagePos.x,
				x2 = x1 + overlap.height + materialThickness,
				x3 = x2 + box.height + materialThickness,
				x4 = x3 + box.length,
				x5 = x4 + box.height + materialThickness,
				x6 = x5 + overlap.height + materialThickness;

			const y1 = imagePos.x,
				y2 = y1 + overlap.height + materialThickness,
				y3 = y2 + box.height + materialThickness,
				y4 = y3 + box.width,
				y5 = y4 + box.height + materialThickness,
				y6 = y5 + overlap.height + materialThickness;

			const adjustedX1 = x2 - Math.max(box.depth, bottomTab.length);
				adjustedX5 = x3 + Math.max(box.depth + topFlapTongue.length, topTab.length);

			const svgDoc = new Svg.Inkscape.Document('doc-tuckbox', paper, docUnits, 'Tuckbox SVG')

			// ***
			// *** Background Layer
			// ***

			if (background && background.color) {
				const bgBleed = background.bleed;

				const backgroundLayer = svgDoc.addChild(Svg.Inkscape.createLayerElement('layer-background', 'Background'));

				const bgBrush = new Svg.Brush(background.color),
					whiteBrush = new Svg.Brush('#FFFFFF');

				backgroundLayer.addChildren(
					new Svg.Path({ x: x2 - bgBleed, y: y1 - bgBleed })
						.addHLineTo(x3 + bgBleed)
						.addVLineTo(y2 - bgBleed)
						.addHLineTo(x5 + bgBleed)
						.addVLineTo(y3 + bgBleed)
						.addHLineTo(x3 + topTab.length + bgBleed)
						.addVLineTo(y4 + bgBleed)
						.addHLineTo(x3 + bgBleed)
						.addVLineTo(y5 - bgBleed)
						.addHLineTo(x3 + topTab.length + bgBleed)
						.addVLineTo(y6 + bgBleed)
						.addHLineTo(x2 - bgBleed)
						.addVLineTo(y5 + bgBleed)
						.addHLineTo(x1 + bottomFlap.gap - bgBleed)
						.addVLineTo(y4 - bgBleed)
						.addHLineTo(x2 - bottomTab.length - bgBleed)
						.addVLineTo(y3 + bgBleed)
						.addHLineTo(x1 - bgBleed)
						.addVLineTo(y2 - bgBleed)
						.addHLineTo(x2 - bottomTab.length - bgBleed)
						.addVLineTo(y1 - bgBleed)
						.addHLineTo(x2 - bgBleed)
						.createElement(bgBrush));

				backgroundLayer.addChildren(
					whiteBrush.createRectElement(
						x2 + sideFlap.taperWidth + bgBleed,
						y1 - bgBleed,
						x3 + bgBleed,
						y2 - sideFlap.gap - bgBleed),
					whiteBrush.createRectElement(
						x1 - bgBleed,
						y2 + bottomFlap.taperWidth + bgBleed,
						x2 - bottomFlap.gap - bgBleed,
						y3 - bottomFlap.taperWidth - bgBleed),
					whiteBrush.createRectElement(
						x2 - bottomTab.length - bgBleed,
						y1 - bgBleed,
						x2 - bgBleed,
						y2 - bgBleed),
					whiteBrush.createRectElement(
						x2 - bottomTab.length - bgBleed,
						y3 + bgBleed,
						x2 - bgBleed,
						y4 - bgBleed));
			}

			// ***
			// *** Outline Layer
			// ***

			const tongueRadii = { rx: topFlapTongue.length, ry: topFlapTongue.curveWidth };

			const outlineLayer = svgDoc.addChild(Svg.Inkscape.createLayerElement('layer-outline', 'Outline'));

			const outlinePen = new Svg.Pen(outlineSettings.pen.width, outlineSettings.pen.color);

			const path = new Svg.Path({ x: x3, y: y3 });

			// Long Side
			path.addVLineTo(y1);
			path.addHLineTo(x4);
			path.addVLineTo(y3);

            // Short Side
			path.addHLineTo(x4 + materialThickness);
			//path.add(createTabPath(settings, xDir, yDir, length, { x: x5, y: y3 )); // TAB
			path.add(createTabPath({
				cornerRadius: 0,
				taperWidth: 0
			}, 1, -1, 33, { x: x3, y: y4 }));

			path.addHLineTo(x6);
			path.addVLineTo(y4);
			path.addHLineTo(x4);

            // Long Side
			path.addVLineTo(y6);
			path.addHLineTo(x3);
			path.addVLineTo(y4);

            // Short Side
			path.addHLineTo(x3 - materialThickness);
			path.addHLineTo(x2); // TAB
			path.addHLineTo(x1);
			path.addVLineTo(y3);
			path.addHLineTo(x3);

			outlineLayer.addChildren(path.createElement(outlinePen));

			// ***
			// *** Alignment Layer
			// ***

			const alignmentLayer = svgDoc.addChild(Svg.Inkscape.createLayerElement('layer-alignment', 'Alignment', { hidden: true }));

			const alignmentBrush1 = new Svg.Brush('#cccccc'),
				alignmentBrush2 = new Svg.Brush('#aaaaaa');

			alignmentLayer.addChildren(
				alignmentBrush1.createRectElement(x1, y2, x2, y3), // Bottom
				alignmentBrush1.createRectElement(x1, y4, x2, y5), // Bottom Flap
				alignmentBrush1.createRectElement(x2, y1, x3, y2), // Side
				alignmentBrush1.createRectElement(x2, y3, x3, y4), // Side
				alignmentBrush1.createRectElement(x2, y5, x3, y6 + sideFlap.gap), // Side flap
				alignmentBrush1.createRectElement(x3, y2, x4, y3), // Top
				alignmentBrush2.createRectElement(x2, y2, x3, y3), // Back
				alignmentBrush2.createRectElement(x2, y4, x3, y5), // Front
				alignmentBrush2.createRectElement(x4, y2, x5, y3)); // Tongue

			// ***
			// *** Artwork Layer
			// ***

			const artworkLayer = svgDoc.addChild(Svg.Inkscape.createLayerElement('layer-artwork', 'Artwork'));

			// ***
			// *** Guide Layer
			// ***

			const guideLayer = svgDoc.addChild(Svg.Inkscape.createLayerElement('layer-guide', 'Guide'));

			const guidePen = new Svg.Pen(outlineSettings.pen.width, outlineSettings.pen.color); // TODO


			return svgDoc.toString();
		}
	};

	// *** Global Scope ***

	window.tuckbox = tuckbox;

})(window);
