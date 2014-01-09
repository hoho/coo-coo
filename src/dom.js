(function() {
    /* global cooMatchCommand */
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooValueToJS */
    /* global cooPushThisVariable */
    /* global cooGetScopeVariablesDecl */
    /* global COO_INTERNAL_VARIABLE_THIS */
    /* global cooGetScopeRet */
    /* global cooProcessBlockAsValue */

    var DOM_FUNC = 'CooCoo.DOM';

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
                            if (!cmd.children.length) {
                                cmd.file.errorMeaninglessCommand(cmd.parts[0]);
                            }

                            var ret = [];

                            ret.push(DOM_FUNC);
                            ret.push('(');
                            ret.push(cooValueToJS(cmd, cmd.parts[1]));
                            ret.push(')');

                            return ret.join('');
                        };

                        cmd.getCodeAfter = function() {
                            return ';';
                        };
                    },

                    'APPEND': {
                        '@': function() {
                            // DOM (expr) APPEND
                            //     ...
                            cmd.hasSubblock = true;
                            cmd.valueRequired = true;

                            cooCreateScope(cmd);
                            cooPushThisVariable(cmd);

                            cmd.getCodeBefore = function() {
                                var ret = [];

                                ret.push(DOM_FUNC);
                                ret.push('(');
                                ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                ret.push(').append(');
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

                                ret.push('}).call(');
                                ret.push(COO_INTERNAL_VARIABLE_THIS);
                                ret.push('));');

                                return ret.join('');
                            };
                        },

                        '(': function() {
                            // DOM (expr) APPEND (expr2)
                            cmd.getCodeBefore = function() {
                                var ret = [];

                                ret.push(DOM_FUNC);
                                ret.push('(');
                                ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                ret.push(').append(');
                                ret.push(cooValueToJS(cmd, cmd.parts[3]));
                                ret.push(')');

                                return ret.join('');
                            };
                        }
                    },

                    'CLASS': {
                        'ADD': {
                            '(': function() {
                                // DOM (expr) CLASS ADD (expr2)
                            }
                        },

                        'REMOVE': {
                            '(': function() {
                                // DOM (expr) CLASS REMOVE (expr2)
                            }
                        }
                    },

                    'TRIGGER': {
                        '': {
                            '@': function() {
                                // DOM (expr) TRIGGER identifier
                                //     ...
                            },

                            '#': function() {
                                // DOM (expr) TRIGGER identifier (expr) (expr2) ...
                            }
                        }
                    },

                    'VALUE': {
                        'SET': {
                            '@': function() {
                                // DOM (expr) VALUE SET
                                //     ...
                            },

                            '(': function() {
                                // DOM (expr) VALUE SET (expr2)
                            }
                        },

                        'GET': function() {
                            // DOM (expr) VALUE GET
                        }
                    },

                    'TEXT': {
                        '@': function() {
                            // DOM (expr) TEXT
                            //     ...
                            return cooProcessBlockAsValue(cmd, {
                                getCodeBeforeBefore: function() {
                                    var ret = [];

                                    ret.push(DOM_FUNC);
                                    ret.push('(');
                                    ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                    ret.push(').text(');

                                    return ret.join('');
                                },

                                getCodeAfterAfter: function() {
                                    return ');';
                                }
                            });
                        },

                        '(': function() {
                            // DOM (expr) TEXT (expr2)
                            cmd.getCodeBefore = function() {
                                var ret = [];

                                ret.push(DOM_FUNC);
                                ret.push('(');
                                ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                ret.push(').text(');
                                ret.push(cooValueToJS(cmd, cmd.parts[3]));
                                ret.push(');');

                                return ret.join('');
                            };
                        }
                    }
                }
            }
        });
    }


    var eventList = {
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
        SUBMIT: 'submit',
        RESET: 'reset',
        FOCUS: 'focus',
        BLUR: 'blur',
        FOCUSIN: 'focusin',
        FOCUSOUT: 'focusout'
    };

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
