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
    /* global cooPushThisVariable */
    /* global COO_INTERNAL_VARIABLE_THIS */
    /* global INDENT */

    var decls = {},
        identifer = 0;

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

                                var inlineParams = cooExtractParamValues(cmd, 3),
                                    paramValues;

                                cooPushThisVariable(cmd);

                                cmd.getCodeBefore = function() {
                                    var decl = decls[cmd.parts[1].value];

                                    if (!decl) {
                                        cmd.file.errorUndeclared(cmd.parts[1]);
                                    }

                                    var ret = [];

                                    ret.push(COO_INTERNAL_VARIABLE_RET);
                                    ret.push('.push(new CooCoo.Template.');
                                    ret.push(cmd.parts[1].value);
                                    ret.push('(');
                                    ret.push(COO_INTERNAL_VARIABLE_THIS);
                                    ret.push(', ');
                                    ret.push(++identifer);
                                    ret.push(')');

                                    if (!cmd.children.length) {
                                        ret.push('.apply(');

                                        if (inlineParams.length) {
                                            ret.push('null, ');
                                            ret.push(inlineParams.join(', '));
                                        }

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
                                            ret.push('\n');
                                            ret.push(INDENT);
                                            ret.push('null, ');
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

                            var params = cooExtractParamNames(cmd, cmd.parts, 2);

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
                                ret.push(' = CooCoo.TemplateBase.extend({\n');

                                if (cmd.debug) {
                                    ret.push(INDENT);
                                    ret.push('__what: "');
                                    ret.push('CooCoo.Template.');
                                    ret.push(cmd.parts[1].value);
                                    ret.push('",\n');
                                }

                                ret.push(INDENT);
                                ret.push('origin: ');
                                ret.push(cmd.data.origin);
                                ret.push('\n});');

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
