(function() {
    /* global $C */

    var currentBindings,
        currentParent,
        conkittyBindings = {};

    $C.define('trigger', function(item, index, arr, args) {
        var funcs,
            i;

        if ((funcs = currentBindings[args[0]])) {
            for (i = 0; i < funcs.length; i++) {
                funcs[i].call(currentParent, this);
            }
        }
    });

    CooCoo.Template = CooCoo.Extendable.extend({
        init: function(parent, id, origin) {
            var self = this,
                bindings;

            self.parent = parent;
            self.origin = origin;

            if (origin.substring(0, 9) !== 'conkitty:') {
                throw new Error('Template is not recognized: "' + origin + '"');
            }

            if (!((bindings = conkittyBindings[(self.id = id)]))) {
                bindings = conkittyBindings[id] = {};
            }

            if ((bindings = bindings[origin])) {
                bindings.count++;
                self.bindings = bindings;
            } else {
                conkittyBindings[id][origin] = self._bindings = {
                    count: 1,
                    name: origin.substring(9)
                };
            }

            self.funcs = {};

            CooCoo.Template.__super__.init.call(self, parent);
        },

        destroy: function() {
            var self = this,
                bindings = conkittyBindings[self.id][self.origin];

            if (bindings) {
                bindings.count--;
                if (!bindings.count) {
                    delete conkittyBindings[self.id][self.origin];
                }
            }

            CooCoo.Template.__super__.destroy.call(self);
        },

        on: function(name, func) {
            var self = this,
                funcs;

            if (!((funcs = self.funcs[name]))) {
                self.funcs[name] = funcs = [];
            }

            funcs.push(func);

            return self;
        },

        apply: function() {
            var self = this,
                args = [null],
                i,
                prevBindings = currentBindings,
                prevParent = currentParent;

            if (self._bindings) {
                conkittyBindings[self.id][self.origin] = self.bindings = self._bindings;
            }

            currentBindings = self.funcs;
            currentParent = self.parent;

            for (i = 0; i < arguments.length; i++) {
                args.push(CooCoo.unwrap(arguments[i]));
            }

            // Reuse i variable for return value.
            i = $C.tpl[self.bindings.name].apply(null, args);

            currentBindings = prevBindings;
            currentParent = prevParent;

            return i;
        }
    });
})();
