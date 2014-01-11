/* global CooCooRet */
CooCoo.Collection = {};

CooCoo.CollectionBase = CooCoo.Base.extend({
    init: function(parent, attrs) {
        this._c = [];
        CooCoo.CollectionBase.__super__.init.call(this, parent, attrs);
    },

    add: function(val) {
        var self = this;

        val = new self.model(self, CooCooRet(val).valueOf());

        this._c.push(val);

        self.trigger('add', val);

        return self;
    }
});
