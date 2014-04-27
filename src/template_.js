(function() {
    /* global $C */

    var currentBindings,
        currentParent;

    $C.on(function(key, val) {
        var funcs,
            i;

        if ((funcs = currentBindings[key])) {
            for (i = 0; i < funcs.length; i++) {
                funcs[i].call(currentParent, val === undefined ? this : val);
            }
        }
    });

    CooCoo.Template = CooCoo.Extendable.extend({
        init: function(parent, id, origin) {
            if (origin.substring(0, 9) !== 'conkitty:') {
                throw new Error('Template is not recognized: "' + origin + '"');
            }

            var self = this;

            self.id = id;
            self.parent = parent;
            self.origin = origin;
            self.name = origin.substring(9);
            self.funcs = {};

            CooCoo.Template.__super__.init.call(self, parent);
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
                i,
                args = [],
                prevBindings = currentBindings,
                prevParent = currentParent;

            currentBindings = self.funcs;
            currentParent = self.parent;

            for (i = 0; i < arguments.length; i++) {
                args.push(CooCoo.u(arguments[i]));
            }

            // Reuse i variable for return value.
            i = $C.tpl[self.name].apply(null, args);

            currentBindings = prevBindings;
            currentParent = prevParent;

            return i;
        }
    });
})();
