/* global CooCooRet */
/* global document */
(function(CooCoo, CooCooRet) {
    var handlers = {},
        CooCooDOM,
        captureEvents = {focus: true, blur: true};

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
            ret.push(cls);
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
                            var parent = e.target['_coo' + self.id],
                                i,
                                ret,
                                cur;

                            if (parent) {
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
        node = CooCooRet(node).valueOf(true);
        val = CooCooRet(val).valueOf();

        if (val === undefined) {
            return node.value || '';
        } else {
            node.value = val;
        }
    };

    CooCooDOM.append = function(parent, node) {
        parent = CooCooRet(parent).valueOf();
        node = CooCooRet(node).toArray();

        for (var i = 0; i < node.length; i++) {
            parent.appendChild(node[i]);
        }
    };

    CooCooDOM.text = function(node, val) {
        node = CooCooRet(node).valueOf(true);
        val = CooCooRet(val).valueOf();

        node.innerHTML = '';
        node.appendChild(document.createTextNode(val));
    };

    CooCooDOM.addClass = function(node, val) {
        node = CooCooRet(node).valueOf(true);
        modifyClass(node, val, false);
    };

    CooCooDOM.removeClass = function(node, val) {
        node = CooCooRet(node).valueOf(true);
        modifyClass(node, val, true);
    };
})(CooCoo, CooCooRet);
