CooCoo.View = {};

CooCoo.ViewBase = CooCoo.Base.extend({
    render: function(ret) {
        var self = this,
            elems = self.__elems = [],
            elem;

        for (var i = 0; i < ret.length; i++) {
            elem = ret[i];

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
    },

    destroy: function() {
        var self = this,
            i,
            elems = self.__elems,
            elem;

        if ((!self.__parent || !self.__parent.__destroyed) && elems) {
            for (i = 0; i < elems.length; i++) {
                elem = elems[i];
                elem.parentNode.removeChild(elem);
            }
        }

        /* jshint -W106 */
        CooCoo.ViewBase.__super__.destroy.call(this);
        /* jshint +W106 */
    }
});
