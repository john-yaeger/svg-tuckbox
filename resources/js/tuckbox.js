// *** Tuckbox Library ***

(function(window, undefined) {

	const outlineSettings = {
		pen: {
			width: 0.2,
			color: '#000000'
		}
	}

	function addTabSideToPath(path, length, dir, xDir, yDir, settings) {
		const taperType = settings.taperType || tuckbox.TAPER_TYPES.SIMPLE,
			taperWidth = settings.taperWidth || 0,
			cornerRadius = settings.cornerRadius || 0,
			catchLength = settings.catchLength || 0,
			curveLength = settings.curveLength || 0;

		const radialAdjustment = ((taperWidth > 0) && (taperType !== tuckbox.TAPER_TYPES.S_CURVE)) ? taperWidth : 0;

		if ((dir < 0) && (cornerRadius > 0)) {
			path.addArcBy(
				{ cx: -xDir * (cornerRadius - radialAdjustment), cy: yDir * cornerRadius },
				{ rx: cornerRadius, ry: cornerRadius },
				(xDir * yDir > 0) ? 1 : 0);
		}

		if (taperWidth > 0) {
			const leftOverLength = length - catchLength - curveLength;

			if ((dir > 0) && (catchLength > 0)) {
				path.addHLineBy(dir * xDir * catchLength);
			}

			if (taperType === tuckbox.TAPER_TYPES.S_CURVE) {
				if ((dir < 0) && (leftOverLength > 0)) {
					path.addHLineBy(dir * xDir * leftOverLength);
				}

				path.addHorizSCurve(dir * xDir * curveLength, yDir * taperWidth);

				if ((dir > 0) && (leftOverLength > 0)) {
					path.addHLineBy(dir * xDir * leftOverLength);
				}
			} else {
				path.addLineBy({ cx: dir * xDir * (length - catchLength + taperWidth), cy: yDir * taperWidth });
			}

			if ((dir < 0) && (catchLength > 0)) {
				path.addHLineBy(dir * xDir * catchLength);
			}
		} else {
			path.addHLineBy(dir * xDir * length);
		}

		if ((dir > 0) && (cornerRadius > 0)) {
			path.addArcBy(
				{ cx: xDir * (cornerRadius - radialAdjustment), cy: yDir * cornerRadius },
				{ rx: cornerRadius, ry: cornerRadius },
				(xDir * yDir > 0) ? 1 : 0);
		}
	}

	function createTabPath(settings, xDir, yDir, length, toPos) {
		const catchLength = settings.catchLength || 0,
			cornerRadius = settings.cornerRadius || 0,
			curveLength = settings.curveLength || 0,
			taper1Type = settings.taper1Type || settings.taperType || null,
			taper1Width = settings.taper1Width || settings.taperWidth || 0,
			taper2Type = settings.taper2Type || settings.taperType || null,
			taper2Width = settings.taper2Width || settings.taperWidth || 0;

		const path = new Svg.Path();

		addTabSideToPath(path, length - cornerRadius, 1, xDir, yDir, {
			taperType: taper1Type,
			taperWidth: taper1Width,
			cornerRadius: cornerRadius,
			catchLength: catchLength,
			curveLength: curveLength
		});

		path.addVLineTo(toPos.y - yDir * (taper2Width + cornerRadius));

		addTabSideToPath(path, length - cornerRadius, -1, xDir, yDir, {
			taperType: taper2Type,
			taperWidth: taper2Width,
			cornerRadius: cornerRadius,
			catchLength: catchLength,
			curveLength: curveLength
		});

		path.addLineTo(toPos);

		return path;
	}

	// *** tuckbox ***

	const tuckbox = {
		TAPER_TYPES: {
			SIMPLE: 1,
			S_CURVE: 2
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
			const userUnits = Units.MM;

			const startPos = {
				x: userUnits.convert(margin.left, paper.units),
				y: userUnits.convert(margin.top, paper.units)
			};

			const box = {
				backWidth: card.width + insideBuffer.width,
				frontWidth: card.width + insideBuffer.width + materialThickness,
				height: card.height + insideBuffer.height,
				depth: card.depth + insideBuffer.depth
			};

			const imageWidth = Math.max(box.depth, bottomTab.length)
				+ box.height
				+ Math.max(box.depth + topFlapTongue.length, topTab.length);

			const imageHeight = box.backWidth + box.frontWidth + (3 * box.depth) - sideFlap.gap;

			const guideLength = 5;
			const guideGap = 2;

			const guideBox = {
				left: startPos.x,
				right: startPos.x + imageWidth + 2 * (guideLength + guideGap),
				top: startPos.y,
				bottom: startPos.y + imageHeight + 2 * (guideLength + guideGap)
			};

			const imagePos = {
				x: Math.ceil(guideBox.left + guideLength + guideGap),
				y: Math.ceil(guideBox.top + guideLength + guideGap)
			};

			imagePos.x = Math.ceil(imagePos.x);
			imagePos.y = Math.ceil(imagePos.y);

			if (bottomTab.length > box.depth) {
				imagePos.x += bottomTab.length - box.depth;
			}

			const x1 = imagePos.x,
				x2 = x1 + box.depth,
				x3 = x2 + box.height,
				x4 = x3 + box.depth,
				x5 = x4 + topFlapTongue.length;

			const y1 = imagePos.y,
				y2 = y1 + box.depth,
				y3 = y2 + box.backWidth,
				y4 = y3 + box.depth,
				y5 = y4 + box.frontWidth,
				y6 = y5 + box.depth - sideFlap.gap;

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

			const path = new Svg.Path({ x: x2, y: y1 });

			// Side Flap
			path.addHLineTo(x3);
			path.addVLineTo(y2);

			if (backSlits.length > 0) {
				path.addHLineTo(x3 - backSlits.length);
				path.addHLineTo(x3);
			}

			// Top Flap & Tongue
			path.addHLineTo(x4);
			path.addArcTo({ x: x5, y: y2 + topFlapTongue.curveWidth }, tongueRadii, 1);
			path.addVLineTo(y3 - topFlapTongue.curveWidth);
			path.addArcTo({ x: x4, y: y3 }, tongueRadii, 1);
			path.addHLineTo(x3);

			if (backSlits.length > 0) {
				path.addHLineTo(x3 - backSlits.length);
				path.addHLineTo(x3);
			}

			path.addVLineTo(y3 + sideFlap.gap);
			path.add(createTabPath({
				catchLength: topTab.catchLength,
				cornerRadius: topTab.cornerRadius,
				curveLength: topTab.curveLength,
				taper2Type: topTab.taperType,
				taper2Width: topTab.taperWidth
			}, 1, 1, topTab.length, { x: x3, y: y4 }));

			path.addVLineTo(y5);

			path.add(createTabPath({
				catchLength: topTab.catchLength,
				cornerRadius: topTab.cornerRadius,
				curveLength: topTab.curveLength,
				taper1Type: topTab.taperType,
				taper1Width: topTab.taperWidth
			}, 1, 1, topTab.length, { x: x3, y: y6 }));

			// Side Flap
			path.addHLineTo(x2 + sideFlap.taperWidth);
			path.addLineTo({ x: x2, y: y5 });

			// Bottom Flap
			path.addLineTo({ x: x1 + bottomFlap.gap, y: y5 - bottomFlap.taperWidth });
			path.addVLineTo(y4 + bottomFlap.taperWidth);
			path.addLineTo({ x: x2, y: y4 });

			path.add(createTabPath({
				cornerRadius: bottomTab.cornerRadius,
				taperWidth: bottomTab.taperWidth
			}, -1, -1, bottomTab.length, { x: x2, y: y3 }));

			// Bottom Flap
			path.addHLineTo(x1);
			path.addVLineTo(y2);
			path.addHLineTo(x2);

			path.add(createTabPath({
				cornerRadius: bottomTab.cornerRadius,
				taperWidth: bottomTab.taperWidth
			}, -1, -1, bottomTab.length, { x: x2, y: y1 }));

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

			guideLayer.addChildren(
				guidePen.createHLineElement(y1, guideBox.left, x2 - bottomTab.length - guideGap),
				guidePen.createHLineElement(y2, guideBox.left, adjustedX1 - guideGap),
				guidePen.createHLineElement(y3, guideBox.left, adjustedX1 - guideGap),
				guidePen.createHLineElement(y4, guideBox.left, Math.min(x1 + bottomFlap.gap, x2 - bottomTab.length) - guideGap),
				guidePen.createHLineElement(y5, guideBox.left, x1 + bottomFlap.gap - guideGap),
				guidePen.createHLineElement(y6, guideBox.left, x2 + sideFlap.taperWidth - guideGap),

				guidePen.createHLineElement(y1, guideBox.right, x3 + guideGap),
				guidePen.createHLineElement(y2, guideBox.right, x5 + guideGap),
				guidePen.createHLineElement(y3, guideBox.right, adjustedX5 + guideGap),
				guidePen.createHLineElement(y4, guideBox.right, x3 + topTab.length + guideGap),
				guidePen.createHLineElement(y5, guideBox.right, x3 + topTab.length + guideGap),
				guidePen.createHLineElement(y6, guideBox.right, x3 + topTab.length + guideGap),

				guidePen.createVLineElement(x1, guideBox.top, y1 - guideGap),
				guidePen.createVLineElement(x2 - bottomTab.length, guideBox.top, y1 - guideGap),
				guidePen.createVLineElement(x2, guideBox.top, y1 - guideGap),
				guidePen.createVLineElement(x3, guideBox.top, y1 - guideGap),
				guidePen.createVLineElement(x3 + topTab.length, guideBox.top, y2 - guideGap),
				guidePen.createVLineElement(x4, guideBox.top, y2 - guideGap),
				guidePen.createVLineElement(x5, guideBox.top, y2 - guideGap),

				guidePen.createVLineElement(x1, guideBox.bottom, y5 + guideGap),
				guidePen.createVLineElement(x2 - bottomTab.length, guideBox.bottom, y5 + guideGap),
				guidePen.createVLineElement(x2, guideBox.bottom, y6 + guideGap),
				guidePen.createVLineElement(x3, guideBox.bottom, y6 + guideGap),
				guidePen.createVLineElement(x3 + topTab.length, guideBox.bottom, y6 + guideGap),
				guidePen.createVLineElement(x4, guideBox.bottom, y3 + guideGap),
				guidePen.createVLineElement(x5, guideBox.bottom, y3 + guideGap)
			);

			if (backSlits.length > 0) {
				guideLayer.addChildren(
					guidePen.createVLineElement(x3 - backSlits.length, guideBox.top, y1 - guideGap),
					guidePen.createVLineElement(x3 - backSlits.length, guideBox.bottom, y6 + guideGap)
				);
			}

			if (bottomFlap.gap > 0) {
				guideLayer.addChildren(
					guidePen.createVLineElement(x1 + bottomFlap.gap, guideBox.top, y1 - guideGap),
					guidePen.createVLineElement(x1 + bottomFlap.gap, guideBox.bottom, y5 + guideGap)
				);
			}

			if (thumbNotch.radius > 0) {
				guideLayer.addChildren(
					guidePen.createCircleElement({ x: x3 + thumbNotch.offset, y: (y4 + y5) / 2}, thumbNotch.radius));
			}

			return svgDoc.toString();
		}
	};

	// *** Global Scope ***

	window.tuckbox = tuckbox;

})(window);
