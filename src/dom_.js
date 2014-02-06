/* global CooCooRet */
/* global document */
(function(CooCoo, CooCooRet) {
    var handlers = {},
        CooCooDOM,
        captureEvents = {focus: true, blur: true},
        props = {checked: true};

    function unwrapArguments(args, firsts) {
        var i,
            first;

        if (!firsts) { firsts = []; }

        for (i = 0; i < args.length; i++) {
            first = firsts[i];
            args[i] = CooCooRet(args[i])[first === 'a' ? 'toArray' : 'valueOf'](first);
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
            var self = this,
                h = handlers[id];

            self.id = id;
            self.node = CooCooRet(node).valueOf();
            self.parent = parent;

            if (h) {
                h.count++;
            } else {
                handlers[id] = self._handlers = {
                    count: 1,
                    events: {} // events: {click: {h: function, funcs: []}}
                };
            }

            node['_coo' + id] = parent;

            CooCoo.DOM.__super__.init.call(self, parent);
        },

        destroy: function() {
            var self = this,
                h = handlers[self.id],
                event;

            if (h && !(--h.count)) {
                h = h.events;
                for (event in h) {
                    document.body.removeEventListener(event, h[event].h);
                }
                delete handlers[self.id];
            }

            CooCooDOM.__super__.destroy.call(self);
        },

        on: function(event, callback) {
            var self = this,
                handler = self._handlers,
                eventHandler,
                funcs;

            if (handler) {
                if (!((eventHandler = handler.events[event]))) {
                    funcs = [];
                    eventHandler = handler.events[event] = {funcs: funcs};

                    document.body.addEventListener(
                        event,
                        (eventHandler.h = function(e) {
                            var parent = e.target,
                                i = '_coo' + self.id,
                                ret,
                                cur;

                            while (parent && !parent[i]) {
                                parent = parent.parentNode;
                            }

                            if (parent && ((parent = parent[i]))) {
                                for (i = 0; i < funcs.length; i++) {
                                    cur = funcs[i].call(parent, e);

                                    if (cur !== undefined && ret === undefined) {
                                        ret = cur;
                                    }
                                }

                                return ret;
                            }
                        }),
                        event in captureEvents
                    );
                }

                eventHandler.funcs.push(callback);
            }

            return self;
        }
    });

    CooCooDOM.val = function(node, val) {
        unwrapArguments(arguments, [true, false]);

        if (val === undefined) {
            return node.value || '';
        } else {
            node.value = val;
        }
    };

    CooCooDOM.append = function(parent, node) {
        unwrapArguments(arguments, [false, 'a']);

        for (var i = 0; i < node.length; i++) {
            parent.appendChild(node[i]);
        }
    };

    CooCooDOM.text = function(node, val) {
        unwrapArguments(arguments, [true, false]);
        node.innerHTML = '';
        node.appendChild(document.createTextNode(val));
    };

    CooCooDOM.addClass = function(node, val) {
        unwrapArguments(arguments, [true, false]);
        modifyClass(node, val, false);
    };

    CooCooDOM.removeClass = function(node, val) {
        unwrapArguments(arguments, [true, false]);
        modifyClass(node, val, true);
    };

    CooCooDOM.toggleClass = function(node, cls, on) {
        unwrapArguments(arguments, [true, true, true]);
        modifyClass(node, cls, !on);
    };

    CooCooDOM.attr = function(node, attr, val) {
        unwrapArguments(arguments, [true, true, false]);

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
        /* global $ */
        unwrapArguments(arguments, [true, true]);
        $(node).trigger(name);
    };

    CooCooDOM.serialize = function(node) {
        unwrapArguments(arguments, [true]);
        return $(node).serializeArray();
    };
})(CooCoo, CooCooRet);
