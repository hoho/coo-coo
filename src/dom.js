(function() {
    /* global cooMatchCommand */
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooValueToJS */
    /* global cooGetScopeVariablesDecl */
    /* global cooWrapRet */
    /* global cooAssertHasSubcommands */
    /* global cooAssertValuePusher */
    /* global cooAssertNotValuePusher */
    /* global cooProcessBlockAsValue */

    var DOM_FUNC = 'CooCoo.DOM',
        DOM_OBJ = 'new ' + DOM_FUNC,
        eventList = {
            click: 'click',
            dblclick: 'dblclick',
            mousedown: 'mousedown',
            mouseup: 'mouseup',
            mouseover: 'mouseover',
            mousemove: 'mousemove',
            mouseout: 'mouseout',
            dragstart: 'dragstart',
            drag: 'drag',
            dragenter: 'dragenter',
            dragleave: 'dragleave',
            dragover: 'dragover',
            drop: 'drop',
            dragend: 'dragend',
            keydown: 'keydown',
            keypress: 'keypress',
            keyup: 'keyup',
            load: 'load',
            unload: 'unload',
            abort: 'abort',
            error: 'error',
            resize: 'resize',
            scroll: 'scroll',
            select: 'select',
            change: 'change',
            input: 'input',
            submit: 'submit',
            reset: 'reset',
            focus: 'focus',
            blur: 'blur',
            focusin: 'focusin',
            focusout: 'focusout'
        };


    function getSetter(method, params) {
        return {
            '#': function(cmd) {
                // dom (expr) class add (expr2) ...
                cooAssertNotValuePusher(cmd);

                cmd.getCodeBefore = function() {
                    var ret = [];

                    ret.push(DOM_FUNC);
                    ret.push('.');
                    ret.push(method);
                    ret.push('(');
                    ret.push(cooValueToJS(cmd, cmd.parts[1]));

                    for (var i = 0; i < params.length; i++) {
                        if (!cmd.parts[params[i]]) {
                            cmd.file.errorIncompleteCommand(cmd.parts[cmd.parts.length - 1]);
                        }

                        ret.push(', ');
                        ret.push(cooValueToJS(cmd, cmd.parts[params[i]]));
                    }

                    ret.push(');');

                    return ret.join('');
                };
            }
        };
    }


    function getGetter(method, params) {
        return function(cmd) {
            // dom (expr) value get
            cooAssertValuePusher(cmd);

            cmd.getCodeBefore = function() {
                var ret = [],
                    retWrap = cooWrapRet(cmd);

                ret.push(retWrap[0]);
                ret.push(DOM_FUNC);
                ret.push('.');
                ret.push(method);
                ret.push('(');
                ret.push(cooValueToJS(cmd, cmd.parts[1]));

                for (var i = 0; i < params.length; i++) {
                    ret.push(', ');
                    ret.push(cooValueToJS(cmd, cmd.parts[params[i]]));
                }

                ret.push(')');
                ret.push(retWrap[1]);

                return ret.join('');
            };
        };
    }


    function domProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'dom': {
                '(': {
                    '@': function() {
                        // dom (expr)
                        cmd.hasSubblock = true;
                        cmd.valueRequired = false;

                        cmd.processChild = domProcessEvents;

                        cmd.getCodeBefore = function() {
                            cooAssertNotValuePusher(cmd);
                            cooAssertHasSubcommands(cmd);

                            var ret = [];

                            if (!cmd.file.ret.data.eventId) {
                                cmd.file.ret.data.eventId = 0;
                            }

                            ret.push(DOM_OBJ);
                            ret.push('(this, ');
                            ret.push(++cmd.file.ret.data.eventId);

                            var tmp = cooValueToJS(cmd, cmd.parts[1]);
                            if (tmp) {
                                ret.push(', ');
                                ret.push(tmp);
                            }

                            ret.push(')');

                            return ret.join('');
                        };

                        cmd.getCodeAfter = function() {
                            return ';';
                        };
                    },

                    'attribute': {
                        '(': {
                            'set': getSetter('attr', [3, 5]),
                            'get': getGetter('attr', [3])
                        }
                    },

                    'append': {
                        '@': function() {
                            // dom (expr) append
                            //     ...
                            cooAssertNotValuePusher(cmd);
                            cmd.data.renderRet = true;

                            return cooProcessBlockAsValue(cmd, {
                                getCodeBeforeBefore: function() {
                                    var ret = [];

                                    ret.push(DOM_FUNC);
                                    ret.push('.append(');
                                    ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                    ret.push(', ');

                                    return ret.join('');
                                },

                                getCodeAfterAfter: function() {
                                    return ');';
                                }
                            });
                        },

                        '(': function() {
                            // dom (expr) append (expr2)
                            cooAssertNotValuePusher(cmd);

                            cmd.getCodeBefore = function() {
                                var ret = [];

                                ret.push(DOM_FUNC);
                                ret.push('.append(');
                                ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                ret.push(', ');
                                ret.push(cooValueToJS(cmd, cmd.parts[3]));
                                ret.push(');');

                                return ret.join('');
                            };
                        }
                    },

                    'class': {
                        'add': getSetter('addClass', [4]),
                        'remove': getSetter('removeClass', [4]),
                        'toggle': getSetter('toggleClass', [4, 5])
                    },

                    'trigger': {
                        '': {
                            '#': function() {
                                // dom (expr) trigger identifier (expr) (expr2) ...
                                cooAssertNotValuePusher(cmd);

                                if (!(cmd.parts[3].value in eventList)) {
                                    cmd.file.errorUnexpectedPart(cmd.parts[3]);
                                }

                                cmd.getCodeBefore = function() {
                                    var ret = [];

                                    ret.push(DOM_FUNC);
                                    ret.push('.trigger(');
                                    ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                    ret.push(', "');
                                    ret.push(eventList[cmd.parts[3].value]);
                                    ret.push('"');

                                    for (var i = 4; i < cmd.parts.length; i++) {
                                        ret.push(', ');
                                        ret.push(cooValueToJS(cmd, cmd.parts[i]));
                                    }

                                    ret.push(');');

                                    return ret.join('');
                                };
                            }
                        }
                    },

                    'value': {
                        'set': getSetter('val', [4]),
                        'get': getGetter('val', [])
                    },

                    'text': {
                        'set': getSetter('text', [4]),
                        'get': getGetter('text', [])
                    },

                    'form': {
                        'serialize': getGetter('serialize', [])
                    }
                }
            }
        });
    }

    var eventPatterns = {

    };

    function getProcessEventFunc(name, hasParam) {
        return function(cmd) {
            // event
            // or
            // event identifier
            cmd.hasSubblock = true;

            cooCreateScope(cmd, true);

            if (hasParam) {
                cooPushScopeVariable(cmd, cmd.parts[1].value, false);
            }

            cmd.getCodeBefore = function() {
                var ret = [];

                ret.push('.on("');
                ret.push(name);
                ret.push('", function(');

                if (hasParam) {
                    ret.push(cmd.parts[1].value);
                }

                ret.push(') {');
                ret.push(cooGetScopeVariablesDecl(cmd));

                return ret.join('');
            };

            cmd.getCodeAfter = function() {
                return '})';
            };
        };
    }

    for (var e in eventList) {
        eventPatterns[e] = {
            '@': getProcessEventFunc(eventList[e], false),
            '': getProcessEventFunc(eventList[e], true)
        };
    }

    function domProcessEvents(cmd) {
        return cooMatchCommand(cmd, eventPatterns);
    }


    CooCoo.cmd.dom = {
        process: domProcess,
        arrange: null,
        base: 'dom'
    };
})();
