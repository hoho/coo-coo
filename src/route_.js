/* global $H */

(function(CooCoo) {
    var routes = {},
        current = {},
        routeCallbackId = 0;

    CooCoo.Route = {};

    CooCoo.RouteBase = CooCoo.Extendable.extend({
        init: function(parent, on, off) {
            var self = this,
                route,
                curArguments;

            if ((route = routes[self.id])) {
                route.callbacks[(self.cid = ('r' + (++routeCallbackId)))] = {
                    parent: parent,
                    on: on,
                    off: off
                };

                if ((curArguments = current[self.id])) {
                    // If this route is active, run its callback.
                    on.apply(parent, curArguments);
                }
            } else {
                var uri,
                    uriParts,
                    key,
                    val,
                    i;

                if (self.nomatch) {
                    uri = null;
                } else {
                    uri = {};
                    uriParts = ['pathname', 'search', 'hash'];

                    for (i = 0; i < uriParts.length; i++) {
                        key = uriParts[i];
                        if ((val = self[key])) {
                            uri[key] = val;
                        }
                    }
                }

                val = function(on) {
                    return function(/* sameMatch, href, ...*/) {
                        curArguments = Array.prototype.slice.call(arguments, 0);

                        val = route.callbacks;

                        for (var key in val) {
                            i = val[key];
                            i[on ? 'on' : 'off'].apply(i.parent, curArguments);
                        }

                        if (on) {
                            current[self.id] = curArguments;
                        } else {
                            delete current[self.id];
                        }
                    };
                };

                routes[self.id] = route = {
                    go: val(true),
                    leave: val(false),

                    callbacks: {}
                };

                $H.on(uri, route);
            }

            CooCoo.RouteBase.__super__.init.call(self, parent);
        },

        destroy: function() {
            var self = this,
                route;

            if ((route = routes[self.id])) {
                delete route.callbacks[self.cid];
            }

            CooCoo.RouteBase.__super__.destroy.call(self);
        }
    });
})(CooCoo);
