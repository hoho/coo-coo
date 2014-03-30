(function(CooCoo) {
    CooCoo.View = {};

    CooCoo.ViewBase = CooCoo.Base.extend({
        init: function(render/*, parent, ...*/) {
            var args = Array.prototype.slice.call(arguments, 1);

            CooCoo.ViewBase.__super__.init.apply(this, args);

            if (render) {
                args.shift();
                return this._render.apply(this, args);
            }
        },

        _render: function() {
            var self = this,
                ret = self.__render.apply(self, arguments);

            self.__elems = ret._e;

            return ret._;
        },

        __render: function() {},

        destroy: function() {
            var self = this,
                i,
                elems = self.__elems,
                elem;

            // TODO: Check if parent view is destroyed, to avoid removeChild from
            //       removed nodes.
            if (elems) {
                for (i = 0; i < elems.length; i++) {
                    elem = elems[i];
                    if (elem.parentNode) {
                        elem.parentNode.removeChild(elem);
                    }
                }
            }

            /* jshint -W106 */
            CooCoo.ViewBase.__super__.destroy.call(self);
            /* jshint +W106 */
        }
    });
})(CooCoo);
