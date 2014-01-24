/* global CooCooRet */
CooCoo.Collection = {};

CooCoo.CollectionBase = CooCoo.Base.extend({
    init: function(/*parent, ...*/) {
        this._c = [];
        CooCoo.CollectionBase.__super__.init.apply(this, arguments);
    },

    __construct: function(items) {
        this.set(items);
    },

    get: function(index) {
        var c = this._c;
        return index === undefined ? c : c[index];
    },

    set: function(items) {
        var self = this,
            i,
            model;

        items = CooCooRet(items).valueOf();

        if (items !== undefined) {
            if (!(items instanceof Array)) { items = [items]; }

            for (i = 0; i < items.length; i++) {
                model = new self.model(self, items[i]);
                model._p = self;
                self._c.push(model);
            }
        }
    },

    add: function(val) {
        var self = this,
            i,
            m;

        val = CooCooRet(val).valueOf();

        if (!(val instanceof Array)) {
            val = [val];
        }

        for (i = 0; i < val.length; i++) {
            m = new self.model(self, val[i]);
            m._p = self;
            self._c.push(m);
            m.trigger('add');
        }

        return self;
    }
});
