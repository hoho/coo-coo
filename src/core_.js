/* global window */
(function(window) {
    var objConstructor = {}.constructor,
        lastId = 0,

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
        },

        isPlainObject = function(obj) {
            // XXX: Rather simplified version of isPlainObject. Fix in case of
            //      necessity.
            return obj && (obj.constructor === objConstructor);
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
        init: function(parent/*, ...*/) {
            var self = this;

            self.__id = ++lastId;
            self.__parent = parent;

            if (parent) {
                self.__root = parent.__root || parent;
                parent.__children[self.__id] = self;
            }

            self.__children = {};

            //console.log('Create: ' + self.__what);

            self.__construct.apply(self, Array.prototype.slice.call(arguments, 1));
        },

        destroy: function() {
            var self = this,
                children = self.__children,
                i;

            self.__destroyed = true;
            self.__destruct();

            for (i in children) {
                children[i].destroy();
            }

            if (self.__parent && !self.__parent.__destroyed) {
                delete self.__parent.__children[self.__id];
            }

            self.__parent = self.__children = null;

            //console.log('Destroy: ' + self.__what);
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
        init: function(/*parent, ...*/) {
            var self = this;
            // Storage for event handlers.
            self.__h = {};
            // Storage for properties.
            self.__d = {};
            // Storage for internal destroy handlers.
            self.__dh = [];
            CooCoo.Base.__super__.init.apply(this, arguments);
        },

        destroy: function() {
            var self = this,
                i;

            self.trigger('destroy', self);

            for (i = 0; i < self.__dh.length; i++) {
                self.__dh[i]();
            }

            CooCoo.Base.__super__.destroy.call(self);

            self.__h = self.__d = self.__dh = null;
        },

        __construct: function(attrs) {
            attrs = CooCooRet(attrs).valueOf();
            if (isPlainObject(attrs)) { this.__d = attrs; }
        },

        on: function(name, callback, context) {
            var self = this,
                sep = name.indexOf(':'),
                prop,
                handlers,
                dest;

            if (sep < 0) { sep = name.length; }

            prop = name.substring(sep + 1);
            name = name.substring(0, sep);

            if (!((handlers = self.__h[name]))) {
                handlers = self.__h[name] = {props: {}, any: []};
            }

            if (prop) {
                if (!((dest = handlers.props[prop]))) {
                    dest = handlers.props[prop] = [];
                }
            } else {
                dest = handlers.any;
            }

            dest.push((prop = [callback, context]));

            // Remove handler on context destruction.
            context.__dh.push(function() {
                for (sep = 0; sep < dest.length; sep++) {
                    if (dest[sep] === prop) {
                        dest.splice(sep, 1);
                        break;
                    }
                }
            });

            return self;
        },

        trigger: function(name/*, ...*/) {
            var self = this,
                nameSrc = name,
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

            if ((handlers = self.__h[name])) {
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

            if (self._p) {
                args.unshift(self);
                args.unshift(nameSrc);
                self._p.trigger.apply(self._p, args);
            }

            return self;
        },

        set: function(name, val) {
            var self = this,
                vals,
                n,
                data = self.__d,
                prev;

            name = CooCooRet(name).valueOf();

            if (isPlainObject(name)) {
                vals = name;
            } else {
                vals = {};
                vals[name] = CooCooRet(val).valueOf();
            }

            for (n in vals) {
                prev = data[n];
                val = data[n] = vals[n];

                if (val !== prev) {
                    self.trigger('change:' + n, val, n, prev);
                }
            }

            return self;
        },

        get: function(name) {
            var d = this.__d;
            return name === undefined ? d : d[name];
        }
    });
})(window);
