(function() {
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooValueToJS */
    /* global cooMatchCommand */
    /* global cooExtractParamValues */
    /* global COO_INTERNAL_VARIABLE_RET */
    /* global cooExtractParamNames */
    /* global cooProcessParam */
    /* global cooGetParamValues */

    var decls = {};

    function templateProcess(cmd) {
        if (cmd.parent) {
            cmd.hasSubblock = true;

            cmd.processChild = templateProcessParamsAndElements;

            return cooMatchCommand(cmd, {
                'TEMPLATE': {
                    '': {
                        'APPLY': {
                            '#': function() {
                                if (!cmd.valuePusher) {
                                    cmd.file.errorMeaninglessValue(cmd.parts[0]);
                                }

                                var inlineParams = cooExtractParamValues(cmd, 3);
                                if (inlineParams.error) {
                                    return inlineParams.error;
                                } else {
                                    inlineParams = inlineParams.values;
                                }

                                var paramValues;

                                cmd.getCodeBefore = function() {
                                    var decl = decls[cmd.parts[1].value];

                                    if (!decl) {
                                        cmd.file.errorUndeclared(cmd.parts[1]);
                                    }

                                    var ret = [];

                                    ret.push(COO_INTERNAL_VARIABLE_RET);
                                    ret.push('.push(CooCoo.Template.');
                                    ret.push(cmd.parts[1].value);
                                    ret.push('()');

                                    if (!cmd.children.length) {
                                        ret.push('.apply(');
                                        ret.push(inlineParams.join(', '));
                                        ret.push('));');
                                    } else {
                                        paramValues = cooGetParamValues(cmd, decl.data.params, inlineParams, cmd.data.elemParams);
                                    }

                                    return ret.join('');
                                };

                                cmd.getCodeAfter = function() {
                                    if (cmd.children.length) {
                                        var ret = [];

                                        ret.push('.apply(');
                                        if (paramValues) {
                                            ret.push(paramValues);
                                        }
                                        ret.push('));');

                                        return ret.join('');
                                    }
                                };
                            }
                        }
                    }
                }
            });
        } else {
            // Template declaration.
            return cooMatchCommand(cmd, {
                'TEMPLATE': {
                    '': {
                        '*': function() {
                            cmd.hasSubblock = true;

                            cmd.processChild = templateProcessDecl;

                            var params = cooExtractParamNames(cmd.parts, 2);

                            if (params.error) {
                                return params.error;
                            } else {
                                params = params.params;
                            }

                            cmd.data = {
                                origin: null,
                                params: params,
                                elemParams: null
                            };

                            if (cmd.parts[1].value in decls) {
                                cmd.parts[1].error = 'Redeclaration';
                                cmd.file.errorUnexpectedPart(cmd.parts[1]);
                            } else {
                                decls[cmd.parts[1].value] = cmd;
                            }

                            cmd.getCodeBefore = function() {
                                var ret = [];

                                ret.push('CooCoo.Template.');
                                ret.push(cmd.parts[1].value);
                                ret.push(' = CooCoo.TemplateBase.create(');
                                ret.push(cmd.data.origin);
                                ret.push(');');

                                return ret.join('');
                            };
                        }
                    }
                }
            });
        }
    }


    function templateProcessDecl(cmd) {
        /* global cooMatchCommand */
        return cooMatchCommand(cmd, {
            'ORIGIN': {
                '(': function() {
                    // ORIGIN "text"
                    if (cmd.parent.data.origin !== null) {
                        cmd.parts[0].error = 'Duplicate origin';
                        return cmd.parts[0];
                    }

                    cmd.parent.data.origin = cooValueToJS(cmd, cmd.parts[1]);
                }
            }
        });
    }


    function templateProcessParamsAndElements(cmd) {
        return cooMatchCommand(cmd, {
            PARAM: {
                '': {
                    '@': function() {
                        return cooProcessParam(cmd, false);
                    },

                    '(': function() {
                        return cooProcessParam(cmd, true);
                    }
                }
            },

            ELEMENT: {
                '(': {
                    '': function() {
                        cmd.hasSubblock = true;

                        cooCreateScope(cmd);
                        cooPushScopeVariable(cmd, cmd.parts[2].value, false);

                        cmd.getCodeBefore = function() {
                            var ret = [];

                            ret.push('.on(');
                            ret.push(cooValueToJS(cmd, cmd.parts[1]));
                            ret.push(', function(');
                            ret.push(cmd.parts[2].value);
                            ret.push(') {');

                            return ret.join('');
                        };

                        cmd.getCodeAfter = function() {
                            return '})';
                        };
                    }
                }
            }
        });
    }


    CooCoo.cmd.TEMPLATE = {
        process: templateProcess,
        arrange: null,
        base: 'template'
    };
})();
