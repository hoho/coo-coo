/* exported CooCoo */
var CooCoo = {
    /* global $E */
    Base: $E.O.extend({
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
    })
};

var CooCooRet = function(val) {
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
CooCooRet.prototype.valueOf = function() { return this._[0]; };
CooCooRet.prototype.toString = function() { return this._.join(''); };
CooCooRet.prototype.toArray = function() { return this._; };
CooCooRet.prototype.isEmpty = function() { return !this._.length; };
