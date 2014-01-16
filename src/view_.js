CooCoo.View = {};

CooCoo.ViewBase = CooCoo.Base.extend({
    _render: function() {
        var self = this,
            elems = self.__elems = [],
            elem,
            ret = self.__render.apply(self, arguments),
            arr = ret.toArray();

        for (var i = 0; i < arr.length; i++) {
            elem = arr[i];

            /* jshint browser: true */
            if (elem instanceof Node) {
                if (elem.nodeType === 11) {
                    // It's a document fragment.
                    elem = elem.firstChild;
                    while (elem) {
                        elems.push(elem);
                        elem = elem.nextSibling;
                    }
                } else {
                    elems.push(elem);
                }
            }
            /* jshint browser: false */
        }

        return ret;
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
