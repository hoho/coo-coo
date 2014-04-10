/* global document */
(function(CooCoo, document) {
    var CooCooDOM,
        eventHandlers = {},
        captureEvents = {focus: true, blur: true},
        props = {checked: true},
        whitespace = /[\x20\t\r\n\f]+/;

    function hasKeys(obj) {
        for (obj in obj) { return true; }
        return false;
    }

    function unwrapArguments(args) {
        var i;

        for (i = 0; i < args.length; i++) {
            args[i] = CooCoo.u(args[i]);
        }
    }

    function splitClass(val) {
        var ret = {},
            i;

        val = (val || '').split(' ');

        for (i = 0; i < val.length; i++) {
            ret[val[i]] = true;
        }

        return ret;
    }

    function modifyClass(node, val, remove) {
        var cls,
            ret = [],
            nodeClass = splitClass(node.getAttribute('class'));

        val = splitClass(val);

        for (cls in val) {
            if (remove) {
                delete nodeClass[cls];
            } else {
                nodeClass[cls] = true;
            }
        }

        for (cls in nodeClass) {
            cls && ret.push(cls);
        }

        node.setAttribute('class', ret.join(' '));
    }

    CooCooDOM = CooCoo.DOM = CooCoo.Extendable.extend({
        init: function(parent, id, node) {
            var self = this;

            self.id = id;
            self.node = CooCoo.u(node);
            self.parent = parent;
            self.events = {};

            CooCoo.DOM.__super__.init.call(self, parent);
        },

        destroy: function() {
            var self = this,
                meta = self.node._coo,
                events = self.events,
                event,
                tmp,
                cur,
                eventHandler;


            for (event in events) {
                tmp = meta[event];
                cur = tmp[self.id];
                delete tmp[self.id];

                if (!hasKeys(tmp)) {
                    delete meta[event];
                }

                eventHandler = eventHandlers[event];
                eventHandler.count -= cur.cb.length;

                if (!eventHandler.count) {
                    document.body.removeEventListener(event, eventHandler.cb);
                    delete eventHandlers[event];
                }
            }

            if (!hasKeys(meta)) {
                delete self.node._coo;
            }

            CooCooDOM.__super__.destroy.call(self);
        },

        on: function(event, callback) {
            var self = this,
                eventHandler,
                cb,
                meta,
                events,
                i;

            events = event.split(whitespace);

            if (events.length !== 1) {
                for (i = 0; i < events.length; i++) {
                    self.on(events[i], callback);
                }
            } else {
                event = events[0];

                if ((eventHandler = eventHandlers[event])) {
                    eventHandler.count++;
                } else {
                    document.body.addEventListener(
                        event,
                        (cb = function (e) {
                            var node = e.target,
                                meta,
                                id,
                                funcs,
                                parent,
                                ret = 0,
                                i;

                            while (node) {
                                if (((meta = node._coo)) && ((meta = meta[event]))) {
                                    for (id in meta) {
                                        funcs = meta[id];
                                        parent = funcs.parent;
                                        funcs = funcs.cb;

                                        for (i = 0; i < funcs.length; i++) {
                                            /* jshint -W016 */
                                            ret |= funcs[i].call(parent, e);

                                            // (ret & 1) - prevent default.
                                            // (ret & 2) - stop propagation.
                                            // (ret & 4) - stop immediate propagation.

                                            if (ret & 1) {
                                                e.preventDefault();
                                            }

                                            if (ret & 2) {
                                                e.stopPropagation();
                                            }

                                            if (ret & 4) {
                                                e.stopImmediatePropagation();
                                                return;
                                            }
                                            /* jshint +W016 */
                                        }
                                    }
                                }

                                /* jshint -W016 */
                                if (ret & 2) {
                                    break;
                                }
                                /* jshint +W016 */
                                node = node.parentNode;
                            }
                        }),
                            event in captureEvents
                    );

                    eventHandlers[event] = {
                        count: 1,
                        cb: cb
                    };
                }

                self.events[event] = true;

                if (!(meta = self.node._coo)) {
                    meta = self.node._coo = {};
                }

                if (event in meta) {
                    meta = meta[event];
                } else {
                    meta = meta[event] = {};
                }

                if (self.id in meta) {
                    meta[self.id].cb.push(callback);
                } else {
                    meta[self.id] = {
                        parent: self.parent,
                        cb: [callback]
                    };
                }
            }

            return self;
        }
    });

    CooCooDOM.val = function(node, val) {
        unwrapArguments(arguments);

        if (val === undefined) {
            return node.value || '';
        } else {
            node.value = val;
        }
    };

    CooCooDOM.append = function(parent, node) {
        unwrapArguments(arguments);
        parent.appendChild(node);
    };

    CooCooDOM.text = function(node, val) {
        unwrapArguments(arguments);
        node.innerHTML = '';
        node.appendChild(document.createTextNode(val));
    };

    CooCooDOM.addClass = function(node, val) {
        unwrapArguments(arguments);
        modifyClass(node, val, false);
    };

    CooCooDOM.removeClass = function(node, val) {
        unwrapArguments(arguments);
        modifyClass(node, val, true);
    };

    CooCooDOM.toggleClass = function(node, cls, on) {
        unwrapArguments(arguments);
        modifyClass(node, cls, !on);
    };

    CooCooDOM.attr = function(node, attr, val) {
        unwrapArguments(arguments);

        if (val === undefined) {
            return attr in props ? node[attr] : node.getAttribute(attr);
        } else {
            if (attr in props) {
                node[attr] = val;
            } else {
                node.setAttribute(attr, val);
            }
        }
    };

    CooCooDOM.trigger = function(node, name/*, ...*/) {
        unwrapArguments(arguments);
        if ((name === 'focus' || name === 'blur') && node[name]) {
            node[name]();
        } else {
            var e = document.createEvent('HTMLEvents');
            e.initEvent(name, true, false);
            node.dispatchEvent(e);
        }
    };

    CooCooDOM.serialize = function(node) {
        unwrapArguments(arguments);
        /* global $ */
        return $(node).serializeArray();
    };
})(CooCoo, document);
