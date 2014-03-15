(function() {
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooValueToJS */
    /* global cooMatchCommand */
    /* global cooExtractParamValues */
    /* global cooWrapRet */
    /* global cooProcessParam */
    /* global cooGetParamValues */
    /* global cooGetScopeVariablesDecl */
    /* global cooAssertValuePusher */


    function templateProcess(cmd) {
        if (cmd.parent) {
            if (!cmd.file.ret.data.templateId) {
                cmd.file.ret.data.templateId = 1;
            }

            cmd.hasSubblock = true;

            cmd.processChild = templateProcessParamsAndElements;

            return cooMatchCommand(cmd, {
                'template': {
                    '(': {
                        'apply': {
                            '#': function() {
                                cooAssertValuePusher(cmd);

                                var paramValues;

                                cmd.getCodeBefore = function() {
                                    var ret = [],
                                        inlineParams = cooExtractParamValues(cmd, 3);

                                    cmd.retWrap = cooWrapRet(cmd);

                                    ret.push(cmd.retWrap[0]);
                                    ret.push('new CooCoo.Template(this, ');
                                    ret.push(cmd.file.ret.data.templateId++);
                                    ret.push(', ');
                                    ret.push(cooValueToJS(cmd, cmd.parts[1]));
                                    ret.push(')');

                                    if (!cmd.children.length) {
                                        ret.push('.apply(');

                                        if (inlineParams.length) {
                                            ret.push(inlineParams.join(', '));
                                        }

                                        ret.push(')');
                                        ret.push(cmd.retWrap[1]);
                                    } else {
                                        paramValues = cooGetParamValues(cmd, inlineParams, cmd.data.elemParams);
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
                                        ret.push(')');
                                        ret.push(cmd.retWrap[1]);

                                        return ret.join('');
                                    }
                                };
                            }
                        }
                    }
                }
            });
        } else {
            return cmd.parts[0];
        }
    }


    function templateProcessParamsAndElements(cmd) {
        return cooMatchCommand(cmd, {
            'param': {
                '@': function() {
                    return cooProcessParam(cmd, false);
                },

                '(': function() {
                    return cooProcessParam(cmd, true);
                }
            },

            '(': {
                '': function() {
                    cmd.hasSubblock = true;

                    cooCreateScope(cmd);
                    cooPushScopeVariable(cmd, cmd.parts[1].value, false, true);

                    cmd.getCodeBefore = function() {
                        var ret = [];

                        ret.push('.on(');
                        ret.push(cooValueToJS(cmd, cmd.parts[0]));
                        ret.push(', function(');
                        ret.push(cmd.parts[1].value);
                        ret.push(') {');
                        ret.push(cooGetScopeVariablesDecl(cmd));

                        return ret.join('');
                    };

                    cmd.getCodeAfter = function() {
                        return '})';
                    };
                }
            }
        });
    }


    CooCoo.cmd.template = {
        process: templateProcess,
        arrange: null,
        base: 'template'
    };
})();
