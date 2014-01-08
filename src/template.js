(function() {
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooValueToJS */
    /* global cooMatchCommand */
    /* global cooExtractParamValues */
    /* global COO_INTERNAL_VARIABLE_RET */

    function templateProcess(cmd) {
        if (cmd.parent) {
            cmd.hasSubblock = true;

            cmd.processChild = templateProcessParamsAndNodes;

            return cooMatchCommand(cmd, {
                'TEMPLATE': {
                    '': {
                        'APPLY': {
                            '#': function() {
                                if (!cmd.valuePusher) {
                                    cmd.file.errorMeaninglessValue(cmd.parts[0]);
                                }

                                var params = cooExtractParamValues(cmd, 3);
                                if (params.error) { return params.error; } else { params = params.values; }

                                cmd.getCodeBefore = function() {
                                    //cooGetDecl(cmd);

                                    var ret = [];

                                    ret.push(COO_INTERNAL_VARIABLE_RET);
                                    ret.push('.push(CooCoo.Template.');
                                    ret.push(cmd.parts[1].value);
                                    ret.push('()');

                                    if (!cmd.children.length) {
                                        ret.push('.apply(');
                                        ret.push(params.join(', '));
                                        ret.push('));');
                                    }

                                    return ret.join('');
                                };

                                cmd.getCodeAfter = function() {
                                    if (cmd.children.length) {
                                        var ret = [];

                                        ret.push('.apply(');
                                        ret.push(params.join(', '));
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

                            cmd.data = {
                                origin: null,
                                params: {}
                            };

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


    function templateProcessParamsAndNodes(cmd) {
        return cooMatchCommand(cmd, {
            PARAM: {
                '': {
                    '@': function() {
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;
                    },

                    '(': function() {
                    }
                }
            },

            NODE: {
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
