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
                getCaller = function(part, setCurrent) {
                    return function(same) {
                        var args,
                            old,
                            i;

                        if (setCurrent === 2) {
                            args = Array.prototype.slice.call(arguments, 1);

                            if (same) {
                                old = self.current;

                                if (!old || (old.length !== args.length)) {
                                    same = false;
                                } else {
                                    // XXX: This is ugly, think of a better
                                    //      way to find change.
                                    for (i = 0; i < args.length; i++) {
                                        if (old[i] !== args[i]) {
                                            same = false;
                                            break;
                                        }
                                    }
                                }
                            }
                        }

                        if (!same || !setCurrent) {
                            if (setCurrent > 0) {
                                self.current = args;
                            }

                            for (var b in bindings) {
                                bindings[b][part].apply(self, self.current || []);
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
                go: getCaller(0, 2),
                leave: getCaller(1, 1),
                complete: getCaller(2, 0)
            }));

            CooCoo.RouteBase.__super__.init.call(self, parent);
        },

        bind: function(id, go, leave, complete) {
            this.bindings[id] = [go, leave, complete];
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
                complete = function() {
                    if (self.changed) {
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
                            complete();
                        };

                    r.bind(self.__id, go, leave, complete);

                    if (r.current) {
                        go.apply(parent, r.current);
                    }
                })(routes[i]);
            }

            self.changed = true;
            complete();
        },

        destroy: function() {
            var self = this,
                i,
                routes = self.routes;
            
            for (i = 2; i < routes.length; i++) {
                routes[i].r.unbind(self.__id);
            }
            
            CooCoo.Routes.__super__.destroy.call(self);
        }
    });
})(CooCoo);
