(function() {
    /* global cooMatchCommand */
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooValueToJS */
    /* global cooGetScopeVariablesDecl */
    /* global cooGetScopeRet */
    /* global cooProcessBlockAsValue */
    /* global COO_INTERNAL_VARIABLE_RET */
    /* global cooAssertHasSubcommands */
    /* global cooAssertValuePusher */
    /* global cooAssertNotValuePusher */

    var DOM_FUNC = 'CooCoo.DOM',
        DOM_OBJ = 'new ' + DOM_FUNC,
        eventList = {
            CLICK: 'click',
            DBLCLICK: 'dblclick',
            MOUSEDOWN: 'mousedown',
            MOUSEUP: 'mouseup',
            MOUSEOVER: 'mouseover',
            MOUSEMOVE: 'mousemove',
            MOUSEOUT: 'mouseout',
            DRAGSTART: 'dragstart',
            DRAG: 'drag',
            DRAGENTER: 'dragenter',
            DRAGLEAVE: 'dragleave',
            DRAGOVER: 'dragover',
            DROP: 'drop',
            DRAGEND: 'dragend',
            KEYDOWN: 'keydown',
            KEYPRESS: 'keypress',
            KEYUP: 'keyup',
            LOAD: 'load',
            UNLOAD: 'unload',
            ABORT: 'abort',
            ERROR: 'error',
            RESIZE: 'resize',
            SCROLL: 'scroll',
            SELECT: 'select',
            CHANGE: 'change',
            INPUT: 'input',
            SUBMIT: 'submit',
            RESET: 'reset',
            FOCUS: 'focus',
            BLUR: 'blur',
            FOCUSIN: 'focusin',
            FOCUSOUT: 'focusout'
        };


    function getSetter(method, params) {
        return {
            '@': function(cmd) {
                // DOM (expr) CLASS ADD
                //     ...
                cooAssertNotValuePusher(cmd);

                return cooProcessBlockAsValue(cmd, {
                    getCodeBeforeBefore: function() {
                        var ret = [];

                        ret.push(DOM_FUNC);
                        ret.push('.');
                        ret.push(method);
                        ret.push('(');
                        ret.push(cooValueToJS(cmd, cmd.parts[1]));

                        for (var i = 0; i < params.length; i++) {
                            if (params[i] === 'b') { break; }
                            ret.push(', ');

                            if (!cmd.parts[params[i]]) {
                                cmd.file.errorIncompleteCommand(cmd.parts[cmd.parts.length - 1]);
                            }

                            ret.push(cooValueToJS(cmd, cmd.parts[params[i]]));
                        }

                        ret.push(', ');

                        return ret.join('');
                    },

                    getCodeAfterAfter: function() {
                        var ret = [];

                        for (var i = params.indexOf('b') + 2; i < params.length; i++) {
                            ret.push(', ');

                            if (!cmd.parts[params[i]]) {
                                cmd.file.errorIncompleteCommand(cmd.parts[cmd.parts.length - 1]);
                            }

                            ret.push(cooValueToJS(cmd, cmd.parts[params[i]]));
                        }

                        ret.push(');');

                        return ret.join('');
                    }
                });
            },

            '#': function(cmd) {
                // DOM (expr) CLASS ADD (expr2)
                cooAssertNotValuePusher(cmd);

                cmd.getCodeBefore = function() {
                    var ret = [];

                    ret.push(DOM_FUNC);
                    ret.push('.');
                    ret.push(method);
                    ret.push('(');
                    ret.push(cooValueToJS(cmd, cmd.parts[1]));

                    for (var i = 0; i < params.length; i++) {
                        if (params[i] === 'b') { continue; }

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
            // DOM (expr) VALUE GET
            cooAssertValuePusher(cmd);

            cmd.getCodeBefore = function() {
                var ret = [];

                ret.push(COO_INTERNAL_VARIABLE_RET);
                ret.push('.push(');
                ret.push(DOM_FUNC);
                ret.push('.');
                ret.push(method);
                ret.push('(');
                ret.push(cooValueToJS(cmd, cmd.parts[1]));

                for (var i = 0; i < params.length; i++) {
                    ret.push(', ');
                    ret.push(cooValueToJS(cmd, cmd.parts[params[i]]));
                }

                ret.push('));');

                return ret.join('');
            };
        };
    }


    function domProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'DOM': {
                '(': {
                    '@': function() {
                        // DOM (expr)
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

                    'ATTR': {
                        '(': {
                            'SET': getSetter('attr', [3, 'b', 5]),
                            'GET': getGetter('attr', [3])
                        }
                    },

                    'APPEND': {
                        '@': function() {
                            // DOM (expr) APPEND
                            //     ...
                            cooAssertNotValuePusher(cmd);

                            cmd.hasSubblock = true;
                            cmd.valueRequired = true;

                            cooCreateScope(cmd);

                            cmd.getCodeBefore = function() {
                                var ret = [];

                                ret.push(DOM_FUNC);
                                ret.push('.append(');
                                ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                ret.push(', ');
                                ret.push('(function() {');
                                ret.push(cooGetScopeVariablesDecl(cmd));

                                return ret.join('');
                            };

                            cmd.getCodeAfter = function() {
                                var ret = [],
                                    tmp = cooGetScopeRet(cmd);

                                if (tmp) {
                                    ret.push(tmp);
                                }

                                ret.push('}).call(this));');

                                return ret.join('');
                            };
                        },

                        '(': function() {
                            // DOM (expr) APPEND (expr2)
                            cooAssertNotValuePusher(cmd);

                            cmd.getCodeBefore = function() {
                                var ret = [];

                                ret.push(DOM_FUNC);
                                ret.push('.append(');
                                ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                ret.push(', ');
                                ret.push(cooValueToJS(cmd, cmd.parts[3]));
                                ret.push(')');

                                return ret.join('');
                            };
                        }
                    },

                    'CLASS': {
                        'ADD': getSetter('addClass', ['b', 4]),
                        'REMOVE': getSetter('removeClass', ['b', 4]),
                        'TOGGLE': getSetter('toggleClass', ['b', 4, 5])
                    },

                    'TRIGGER': {
                        '': {
                            '#': function() {
                                // DOM (expr) TRIGGER identifier (expr) (expr2) ...
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

                    'VALUE': {
                        'SET': getSetter('val', ['b', 4]),
                        'GET': getGetter('val', [])
                    },

                    'TEXT': {
                        'SET': getSetter('text', ['b', 4]),
                        'GET': getGetter('text', [])
                    }
                }
            }
        });
    }

    var eventPatterns = {

    };

    function getProcessEventFunc(name, hasParam) {
        return function(cmd) {
            // EVENT
            // or
            // EVENT identifier
            cmd.hasSubblock = true;

            cooCreateScope(cmd);

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


    CooCoo.cmd.DOM = {
        process: domProcess,
        arrange: null,
        base: 'dom'
    };
})();
