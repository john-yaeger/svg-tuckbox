jQuery(function($) {
	const PAPER_TYPES = {
		A4: {
			height: '297',
			units: Units.MM,
			width: '210'
		},
		LETTER: {
			height: '11',
			units: Units.INCHES,
			width: '8.5'
		},
		LEGAL: {
			height: '14',
			units: Units.INCHES,
			width: '8.5'
		},
		TABLOID: {
			height: '17',
			units: Units.INCHES,
			width: '11'
		}
	};

	const $settings = $('#settings'),
		$topFieldGroups = $settings.children();

	const $fieldGroupChooser = $('#fieldGroupChooser');

	$topFieldGroups.each(function() {
		const $fieldGroup = $(this),
			title = $fieldGroup.children('legend').text(),
			$selector = $('<li></li>');
		$selector.html(title).data('$fieldGroup', $fieldGroup);
		$fieldGroup.data('$selector', $selector);
		$fieldGroupChooser.append($selector);
	});

	const $paperInputs = $settings.find('.paper.units').closest('.field').find('input'),
		$imageInputs = $settings.find('.document.units').closest('.field').find('input');

	function showGroup($fieldGroup) {
		$topFieldGroups.each(function() {
			let $fieldGroup = $(this);
			$fieldGroup.hide().data('$selector').removeClass('active');
		});
		$fieldGroup.data('$selector').addClass('active');
		$fieldGroup.show();
	}

	function updatePreview() {
		const $preview = $('#preview');

			const paper = {
				height: Number($('#paper_height').val()),
				width: Number($('#paper_width').val())
			};

			$preview.attr('height', $preview.attr('width') * ( paper.height / paper.width));

			const doc = generateDoc();

			$('#doc').val(doc);

			const $svg = $(doc).filter('svg');

			$preview.attr('viewBox', $svg.attr('viewBox')).html($svg.find('g'));

			//$('#preview').find('#layer-background').hide();
	}

	function changeUnits($inputs, toUnits) {
		$inputs.each(function() {
			const $input = $(this),
				currentUnits = $input.data('units');

			if (currentUnits && (currentUnits !== toUnits)) {
			console.log(typeof currentUnits);
				const storedValue = $input.data('storedValue');
				$input.val((storedValue && (storedValue.units === toUnits))
					? storedValue.value
					: toUnits.convert(Number($input.val()), currentUnits));
			}

			$input.data('units', toUnits).closest('.field').find('.units').text(toUnits.abbrev);
		});
	}

	function updateStoredValue($input) {
		$input.data('storedValue', {
			value: $input.val(),
			units: $input.data('units')
		});
	}

	function updateTopTabTaperTypeSCurveExtraLength() {
		const taperType = tuckbox.TAPER_TYPES[$('#topTab_taperType').val()];

		if (taperType === tuckbox.TAPER_TYPES.S_CURVE) {
			const catchLength = Number($('#topTab_catchLength').val()),
				cornerRadius = Number($('#topTab_cornerRadius').val()),
				curveLength = Number($('#topTab_curveLength').val()),
				length = Number($('#topTab_length').val());

			$('#topTab_extraLength').val(length - catchLength - curveLength - cornerRadius);
		} else {
			$('#topTab_extraLength').val('');
		}
	}

	$('#paper_type').change(function() {
		const code = $(this).val();
		if (code != '') {
			const paperType = PAPER_TYPES[code];
			$('#paper_units_select').prop('disabled', true).addClass('readonly').val(paperType.units.id).change();
			$('#paper_height').prop('readonly', true).val(paperType.height).change();
			$('#paper_width').prop('readonly', true).val(paperType.width).change();
		} else {
			$('#paper_height').prop('readonly', false);
			$('#paper_width').prop('readonly', false);
			$('#paper_units_select').prop('disabled', false).removeClass('readonly');
		}
	}).change();

	$('#paper_units_select').change(function() {
		const val = $(this).val();
		$('#paper_units').val(val);
		changeUnits($paperInputs, Units.fromId(val));
	}).change();

	$('#doc_units').change(function() {
		changeUnits($imageInputs, Units.fromId($(this).val()));
	}).change();

	$('#topTab_taperType').change(function() {
		const taperType = tuckbox.TAPER_TYPES[$(this).val()];

		if (taperType === tuckbox.TAPER_TYPES.S_CURVE) {
			$('#topTabsFieldGroup').find('.field.for_topTabTaperTypeSCurve').prop('disabled', false).closest('.field').slideDown('fast');
		} else {
			$('#topTabsFieldGroup').find('.field.for_topTabTaperTypeSCurve').prop('disabled', true).closest('.field').slideUp('fast');
		}
	}).change();

	$paperInputs.data('units', Units.fromId($('#paper_units').val())).each(function() {
		updateStoredValue($(this));
	}).change(function() {
		updateStoredValue($(this));
	});

	$imageInputs.data('units', Units.fromId($('#doc_units').val())).each(function() {
		updateStoredValue($(this));
	}).change(function() {
		updateStoredValue($(this));
	});

	function generateDoc() {
		const paperUnits = Units.fromId($('#paper_units').val()),
			docUnits = Units.fromId($('#doc_units').val());

		function getUserUnits(val) {
			return Units.MM.convert(Number(val), docUnits);
		}

		const paper = {
			height: Number($('#paper_height').val()),
			units: paperUnits,
			width: Number($('#paper_width').val())
		};

		const margin = {
			left: Number($('#paper_margin_left').val()),
			top: Number($('#paper_margin_top').val()),
		};

		const card = {
			height: getUserUnits($('#card_height').val()),
			depth: getUserUnits($('#card_depth').val()),
			width: getUserUnits($('#card_width').val())
		};

		const insideBuffer = {
			depth: getUserUnits($('#insideBuffer_depth').val()),
			height: getUserUnits($('#insideBuffer_height').val()),
			width: getUserUnits($('#insideBuffer_width').val())
		};

		const materialThickness = getUserUnits($('#material_thickness').val());

		const topFlapTongue = {
			curveWidth: getUserUnits($('#topFlapTongue_curveWidth').val()),
			length: getUserUnits($('#topFlapTongue_length').val())
		};

		const sideFlap = {
			gap: getUserUnits($('#sideFlap_gap').val()),
			taperWidth: getUserUnits($('#sideFlap_taperWidth').val())
		};

		const bottomFlap = {
			gap: getUserUnits($('#bottomFlap_gap').val()),
			taperWidth: getUserUnits($('#bottomFlap_taperWidth').val())
		};

		const topTab = {
			catchLength: getUserUnits($('#topTab_catchLength').val()),
			cornerRadius: getUserUnits($('#topTab_cornerRadius').val()),
			curveLength: getUserUnits($('#topTab_curveLength').val()),
			length: getUserUnits($('#topTab_length').val()),
			taperType: tuckbox.TAPER_TYPES[$('#topTab_taperType').val()],
			taperWidth: getUserUnits($('#topTab_taperWidth').val())
		};

		const bottomTab = {
			cornerRadius: getUserUnits($('#bottomTab_cornerRadius').val()),
			length: getUserUnits($('#bottomTab_length').val()),
			taperWidth: getUserUnits($('#bottomTab_taperWidth').val())
		};

		const backSlits = {
			length: Number($('#backSlits_length').val())
		};

		const lockSlits = {
			length: Number($('#lockSlits_length').val())
		};

		const thumbNotch = {
			radius: Number($('#thumbNotch_radius').val()),
			offset: Number($('#thumbNotch_offset').val())
		};

		const background = {
			color: $('#background_color').val(),
			bleed: Number($('#background_bleed').val())
		};

		return tuckbox.createDoc(
			paper,
			margin,
			docUnits,
			card,
			insideBuffer,
			materialThickness,
			topFlapTongue,
			sideFlap,
			bottomFlap,
			topTab,
			bottomTab,
			backSlits,
			lockSlits,
			thumbNotch,
			background);
	}

	$fieldGroupChooser.on('click', '>li', function() {
		const $fieldGroup = $(this).data('$fieldGroup');
		showGroup($fieldGroup);
	});

	$('input, select').on('input change', function() {
		const $field = $(this);

		if ($field.is('.update_topTabTaperTypeSCurveExtraLength')) {
			updateTopTabTaperTypeSCurveExtraLength();
		};

		updatePreview();
	});

	$('select').on('change', function() {
		updatePreview();
	});

	$('#svgViewButton').click(function() {
		const svg = $('#doc').val();

		updatePreview(); // TODO
	});

	$('#svgCopyButton').click(function() {
		const svg = $('#doc').val();

		navigator.clipboard.writeText(svg);
	});

	$('#svgSaveButton').click(function() {
		const svg = $('#doc').val();

		Utils.saveFile('tuckbox.svg', 'text/xml', svg);
	});

	updateTopTabTaperTypeSCurveExtraLength();
	updatePreview();

	showGroup($topFieldGroups.first());
	$settings.show();
});
