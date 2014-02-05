/* global CooCooRet */
(function(CooCoo, CooCooRet) {

    function getKeys(items) {
        var ret = [],
            i;

        for (i in items) {
            ret.push(i);
        }

        return ret;
    }

    CooCoo.Collection = {};

    CooCoo.CollectionBase = CooCoo.Base.extend({
        init: function(/*parent, ...*/) {
            // Collection items.
            this.__i = {};
            this.length = 0;

            CooCoo.CollectionBase.__super__.init.apply(this, arguments);
        },

        __construct: function(items) {
            var self = this;

            self.add(items);

            self.on('destroy', function(m) {
                if (m) {
                    self.remove(m);
                } else {
                    var i,
                        item,
                        items = self.__i,
                        ids = getKeys(items);

                    for (i = 0; i < ids.length; i++) {
                        if ((item = items[ids[i]])) {
                            if (item.__parent === self) {
                                item.destroy();
                            } else {
                                self.remove(item);
                            }
                        }
                    }
                }
            }, self);
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
                    model.__e[self.__id] = self;
                    self.__i[model.__id] = model;
                    self.length++;
                    model.trigger('add');
                }
            }

            return self;
        },

        remove: function(model) {
            if (model) {
                var self = this;

                if (self.__i[model.__id]) {
                    self.length--;
                    delete self.__i[model.__id];
                    model.trigger('remove');
                    delete model.__e[self.__id];
                }
            }
        },

        each: function(callback, parent) {
            var self = this,
                i,
                item,
                items = self.__i,
                ids = getKeys(items);

            for (i = 0; i < ids.length; i++) {
                if ((item = items[ids[i]])) {
                    callback.call(parent || self, item);
                }
            }
        }
    });

})(CooCoo, CooCooRet);
