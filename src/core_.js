/* global window */
(function(window) {
    var objConstructor = {}.constructor,

        CooCoo = window.CooCoo = {
            Extendable: function() {}
        },

        CooCooRet = window.CooCooRet = function(val) {
            if (this.constructor === CooCooRet) {
                this._ = val instanceof CooCooRet ?
                    val.toArray()
                    :
                    (val === undefined ? [] : [val]);
            } else {
                return new CooCooRet(val);
            }
        };


    CooCooRet.prototype.push = function(val) {
        if (val instanceof CooCooRet) {
            this._ = this._.concat(val.toArray());
        } else if (val !== undefined) {
            this._.push(val);
        }
    };
    CooCooRet.prototype.valueOf = function(firstOnly) {
        return firstOnly || this._.length < 2 ? this._[0] : this._;
    };
    CooCooRet.prototype.toArray = function() { return this._; };
    CooCooRet.prototype.isEmpty = function() { return !this._.length; };


    CooCoo.Extendable.prototype = {
        init: function(parent, attrs) {
            var self = this;

            self.__parent = parent;

            if (parent) {
                self.__root = parent.__root || parent;
                parent.__children.push(self);
            }

            self.__children = [];

            console.log('Create: ' + self.__what);

            self.__construct(attrs);
        },

        destroy: function() {
            var self = this,
                children = self.__children,
                i;

            self.__destroyed = true;
            self.__destruct();

            for (i = 0; i < children.length; i++) {
                children[i].destroy();
            }

            if (self.__parent && !self.__parent.__destroyed) {
                children = self.__parent.__children;

                for (i = 0; i < children.length; i++) {
                    if (children[i] === self) {
                        children.splice(i, 1);
                        break;
                    }
                }
            }

            console.log('Destroy: ' + self.__what);
        },

        __construct: function() {},

        __destruct: function() {}
    };


    CooCoo.Extendable.extend = function(obj) {
        var self = this,
            proto,
            key,

            F = function() {},

            CooCooBase = function CooCooBase() {
                this.init.apply(this, arguments);
            };

        F.prototype = self.prototype;
        proto = CooCooBase.prototype = new F();

        proto.constructor = CooCooBase;

        for (key in obj) {
            proto[key] = obj[key];
        }

        CooCooBase.extend = CooCoo.Extendable.extend;
        CooCooBase.__super__ = self.prototype;

        return CooCooBase;
    };


    CooCoo.Base = CooCoo.Extendable.extend({
        init: function(parent, attrs) {
            this._h = {};
            this._d = {};
            CooCoo.Base.__super__.init.call(this, parent, attrs);
        },

        destroy: function() {
            var self = this;
            self.trigger('destroy', self);
            CooCoo.Base.__super__.destroy.call(self);
        },

        on: function(name, callback, context) {
            var self = this,
                sep = name.indexOf(':'),
                prop,
                propHandlers,
                handlers;

            if (sep < 0) { sep = name.length; }

            prop = name.substring(sep + 1);
            name = name.substring(0, sep);

            if (!((handlers = self._h[name]))) {
                handlers = self._h[name] = {props: {}, any: []};
            }

            if (prop) {
                if (!((propHandlers = handlers.props[prop]))) {
                    propHandlers = handlers.props[prop] = [];
                }
                propHandlers.push([callback, context]);
            } else {
                handlers.any.push([callback, context]);
            }

            return self;
        },

        trigger: function(name/*, ...*/) {
            var self = this,
                sep = name.indexOf(':'),
                prop,
                handlers,
                i,
                callbacks,
                callback,
                args = Array.prototype.splice.call(arguments, 1);

            if (sep < 0) { sep = name.length; }

            prop = name.substring(sep + 1);
            name = name.substring(0, sep);

            if ((handlers = self._h[name])) {
                callbacks = handlers.any;

                for (i = 0; i < callbacks.length; i++) {
                    callback = callbacks[i];
                    callback[0].apply(callback[1] || self, args);
                }

                if (prop && ((callbacks = handlers.props[prop]))) {
                    for (i = 0; i < callbacks.length; i++) {
                        callback = callbacks[i];
                        callback[0].apply(callback[1] || self, args);
                    }
                }
            }

            return self;
        },

        set: function(name, val) {
            var self = this,
                vals,
                n,
                data = self._d,
                prev;

            name = CooCooRet(name).valueOf();

            // XXX: Rather simplified version of isPlainObject. Fix in case of
            //      necessity.
            if (name && (name.constructor === objConstructor)) {
                vals = name;
            } else {
                vals = {};
                vals[name] = CooCooRet(val).valueOf();
            }

            for (n in vals) {
                prev = data[n];
                val = data[n] = vals[n];

                if (val !== prev) {
                    self.trigger('change:' + n, n, val, prev);
                }
            }

            return self;
        },

        get: function(name) {
            var d = this._d;
            return name === undefined ? d : d[name];
        }
    });
})(window);
