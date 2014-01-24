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
            i;

        items = CooCooRet(items).valueOf();
        if (!(items instanceof Array)) { items = [items]; }

        for (i = 0; i < items.length; i++) {
            self._c.push(new self.model(self, items[i]));
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
            self._c.push(m);
            self.trigger('add', m);
            m.trigger('add', m);
        }

        return self;
    }
});
