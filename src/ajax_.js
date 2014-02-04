/* global $ */
/* global CooCooRet */
CooCoo.Ajax = CooCoo.Extendable.extend({
    init: function(parent, settings) {
        var self = this,
            prop;

        CooCoo.Ajax.__super__.init.call(self, parent);

        for (prop in settings) {
            settings[prop] = CooCooRet(settings[prop]).valueOf();
        }

        self._req = $.ajax({
            url: settings.url,
            type: settings.method,
            contentType: settings.type,
            data: settings.data,

            success: function(data) {
                if (!self._aborted) {
                    var success = settings.success;
                    if (success) { success.call(parent, data); }
                }
            },

            error: function() {
                if (!self._aborted) {
                    var error = settings.error;
                    if (error) { error.call(parent); }
                }
            },

            complete: function() {
                if (!self._aborted) {
                    var complete = settings.complete;
                    if (complete) { complete.call(parent); }
                }
                self._req = null;
            }
        });
    },

    destroy: function() {
        var self = this;

        if (self._req) {
            self._aborted = true;
            self._req.abort();
            self._req = null;
        }

        CooCoo.Ajax.__super__.destroy.call(self);
    }
});
