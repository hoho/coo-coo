/* global CooCooRet */
CooCoo.Collection = {};

CooCoo.CollectionBase = CooCoo.Base.extend({
    init: function(/*parent, ...*/) {
        this._c = [];
        CooCoo.CollectionBase.__super__.init.apply(this, arguments);
    },

    __construct: function(items) {
        var self = this;
        self.add(items);
        self.on('destroy', function(m) { self.remove(m); }, self);
    },

    length: function() {
        return this._c.length;
    },

    item: function(index) {
        var c = this._c;
        return index === undefined ? c.slice(0) : c[index];
    },

    add: function(val) {
        var self = this,
            i,
            model;

        val = CooCooRet(val).valueOf();

        if (val !== undefined) {
            if (!(val instanceof Array)) {
                val = [val];
            }

            for (i = 0; i < val.length; i++) {
                model = new self.model(self, val[i]);
                model._p = self;
                self._c.push(model);
                model.trigger('add');
            }
        }

        return self;
    },

    remove: function(model) {
        if (model) {
            // TODO: Do something with linear complexity of this method.
            var self = this,
                i,
                items = self._c;

            for (i = 0; i < items.length; i++) {
                if (items[i] === model) {
                    items.splice(i, 1);
                    model.trigger('remove');
                    model._p = null;
                    break;
                }
            }
        }
    },

    each: function(callback, parent) {
        var self = this,
            i,
            items = self._c.slice(0);

        for (i = 0; i < items.length; i++) {
            callback.call(parent || self, items[i]);
        }
    }
});
