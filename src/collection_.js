/* global CooCooRet */
CooCoo.Collection = {};

CooCoo.CollectionBase = CooCoo.Base.extend({
    init: function(/*parent, ...*/) {
        this._c = [];
        CooCoo.CollectionBase.__super__.init.apply(this, arguments);
    },

    __construct: function(items) {
        this.add(items);
    },

    item: function(index) {
        var c = this._c;
        return index === undefined ? c : c[index];
    },

    add: function(val) {
        var self = this,
            i,
            m;

        val = CooCooRet(val).valueOf();

        if (val !== undefined) {
            if (!(val instanceof Array)) {
                val = [val];
            }

            for (i = 0; i < val.length; i++) {
                m = new self.model(self, val[i]);
                m._p = self;
                self._c.push(m);
                m.trigger('add');
            }
        }

        return self;
    }
});
