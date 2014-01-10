(function() {
    /* global $C */

    var currentBindings,
        conkittyBindings = {};

    $C.define('trigger', function(item, index, arr, args) {
        var funcs,
            i;

        if ((funcs = currentBindings[args[0]])) {
            for (i = 0; i < funcs.length; i++) {
                funcs[i](this);
            }
        }
    });

    CooCoo.Template = {};

    CooCoo.TemplateBase = CooCoo.Base.extend({
        init: function(parent, identifier) {
            var self = this,
                bindings = conkittyBindings[(self.id = identifier)];

            if (bindings) {
                bindings.count++;
                self.bindings = bindings;
            } else {
                if (self.origin.substring(0, 9) === 'conkitty:') {
                    self._bindings = {
                        count: 1,
                        name: self.origin.substring(9),
                        funcs: {}
                    };
                } else {
                    throw new Error('Template origin is not recognized');
                }
            }

            CooCoo.TemplateBase.__super__.init.call(self, parent);
        },

        destroy: function() {
            var self = this,
                bindings = conkittyBindings[self.id];

            if (bindings) {
                bindings.count--;
                if (!bindings.count) {
                    delete conkittyBindings[self.id];
                }
            }

            CooCoo.TemplateBase.__super__.destroy.call(self);
        },

        on: function(name, func) {
            var self = this,
                funcs;

            if (!self.bindings) {
                if (!((funcs = self._bindings.funcs[name]))) {
                    self._bindings.funcs[name] = funcs = [];
                }

                funcs.push(func);
            }

            return self;
        },

        apply: function() {
            var self = this;

            if (self._bindings) {
                conkittyBindings[self.id] = self.bindings = self._bindings;
            }

            currentBindings = self.bindings.funcs;

            return $C.tpl[self.bindings.name].apply(null, arguments);
        }
    });
})();
