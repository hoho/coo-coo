/* global $H */

(function(CooCoo) {
    CooCoo.Route = {};

    CooCoo.RouteBase = CooCoo.Extendable.extend({
        init: function(parent) {
            var self = this,
                uri,
                uriParts,
                key,
                val,
                i,
                bindings = self.bindings = {},
                getCaller = function(go) {
                    return function(same) {
                        if (!same) {
                            if (go) {
                                self.current = Array.prototype.slice.call(arguments, 1);
                            }

                            for (var b in bindings) {
                                bindings[b][go ? 0 : 1].apply(self, self.current || []);
                            }
                        }
                    };
                };

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

            $H.on((self.uri = uri), (self.cb = {
                go: getCaller(true),
                leave: getCaller(false)
            }));

            CooCoo.RouteBase.__super__.init.call(self, parent);
        },

        bind: function(id, go, leave) {
            this.bindings[id] = [go, leave];
        },

        unbind: function(id) {
            delete this.bindings[id];
        },

        destroy: function() {
            var self = this;

            $H.off(self.uri, self.cb);

            CooCoo.RouteBase.__super__.destroy.call(self);
        }
    });

    CooCoo.Routes = CooCoo.Extendable.extend({
        init: function(parent/*, otherwise, route1, route2, ...*/) {
            // otherwise is a callback when none of routeNs are matched.
            // routeN is an object: {r: <Route instance>, c: <callback>}.
            var self = this,
                routes = self.routes = arguments,
                i,
                done = self._done = function() {
                    if (self.changed && !self.__destroyed) {
                        if (self.matches) {
                            var i,
                                cb,
                                matches = self.matches;

                            // Call macth in order of declaration.
                            for (i = 2; i < routes.length; i++) {
                                if ((cb = matches[routes[i].r.__id])) {
                                    cb[0].apply(parent, cb[1]);
                                    break;
                                }
                            }
                        } else if (self.otherwise) {
                            self.otherwise.call(parent);
                        }
                        self.changed = self.matches = false;
                    }
                };

            CooCoo.Routes.__super__.init.call(self, parent);

            self.otherwise = routes[1];

            for (i = 2; i < routes.length; i++) {
                (function(route) {
                    var r = route.r,
                        c = route.c,

                        go = function() {
                            if (!self.matches) {
                                self.matches = {};
                            }

                            self.changed = true;
                            // Remember match callback and arguments.
                            self.matches[r.__id] = [c, arguments];
                        },

                        leave = function() {
                            self.changed = true;
                        };

                    r.bind(self.__id, go, leave);

                    if (r.current) {
                        go.apply(parent, r.current);
                    }
                })(routes[i]);
            }

            self.changed = true;
            done();

            $H.on(undefined, done);
        },

        destroy: function() {
            var self = this,
                i,
                routes = self.routes;
            
            for (i = 2; i < routes.length; i++) {
                routes[i].r.unbind(self.__id);
            }

            $H.on(undefined, self._done);

            CooCoo.Routes.__super__.destroy.call(self);
        }
    });
})(CooCoo);
