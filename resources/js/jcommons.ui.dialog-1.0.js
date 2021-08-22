// *** jCommons UI Dialog (jC.ui.dialog) v1.0 Library ***

(function(window, $, undefined) {

// *** dialog ***

var dialog = {
	VERSION: '1.0',

	Z_INDEX: 10000,

	CLOSE_DIALOG_CALLBACK: function() { $(this).dialog('close'); },

	MODAL_ON_OPEN: function() {
		$(this).closest('.ui-dialog').prev('.ui-widget-overlay').addBack().css('z-index', dialog.Z_INDEX);
	},

	MODAL_ON_CLOSE: function() { $(this).dialog('destroy').remove(); },

	MODAL_OPTIONS: {
		draggable: false,
		modal: true,
		position: { my: 'center top', at: 'center top' },
		resizable: false,
		width: 500
	},

	NO_CLOSE_ON_OPEN: function() { $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide(); },

	NO_CLOSE_OPTIONS: {
		closeOnEscape: false
	},

	modal: function(content, options = {}) {
		return $('<div></div>').dialog($.extend({}, dialog.MODAL_OPTIONS, options, {
				open: jC.callback.chain(dialog.MODAL_ON_OPEN, options.open),
				close: jC.callback.chain(options.close, dialog.MODAL_ON_CLOSE)
			})).html(content);
	},

	noCloseModal: function(content, options) {
		dialog.modal(content, $.extend({}, dialog.NO_CLOSE_OPTIONS, options, {
			open: jC.callback.chain(dialog.NO_CLOSE_ON_OPEN, options.open)
		}));
	},

	message: function(content, options) {
		dialog.modal(content, $.extend({}, {
			buttons: [{ text: 'OK', click: dialog.CLOSE_DIALOG_CALLBACK }]
		}, options));
	},

	chooser: function(content, choices, options) {
		var buttons = jC.collect(choices, function(i, choice) {
			choice = choice || {};
			return {
				text: jC.defaultIfUndefined(choice.text, ('Choice ' + i)),
				click: jC.callback.chain(dialog.CLOSE_DIALOG_CALLBACK, choice.callback)
			};
		});
		dialog.noCloseModal(content, $.extend({ buttons: buttons }, options));
	}
};

// *** Global Scope ***

window.jC.ui = window.jC.ui || {};
window.jC.ui.dialog = dialog;

})(window, jC.topUsableWindow.jQuery);
