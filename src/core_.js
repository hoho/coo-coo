/* exported CooCoo */
var CooCoo = {

    /* global $E */
    Base: $E.O.extend({
        init: function(parent, attrs) {
            var self = this,
                attr;

            self.__parent = parent;
            self.__root = parent.__root || parent;
            self.__children = [];

            for (attr in attrs) {
                self.set(attr, attrs[attr]);
            }
        },

        destroy: function() {
            var self = this,
                children = self.__children,
                i;

            self.__destroyed = true;

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
        }
    })
};
