(function() {
    /* global cooObjectBase */
    /* global cooExtractParamValues */
    /* global COO_INTERNAL_VARIABLE_RET */
    /* global cooValueToJS */
    /* global cooGetDecl */
    /* global cooProcessParam */
    /* global cooMatchCommand */
    /* global cooGetParamValues */

    cooObjectBase(
        {
            cmdName: 'VIEW',
            cmdStorage: 'CooCoo.View',
            baseClass: {name: 'CooCoo.ViewBase'}
        },
        {
            init: true,
            properties: true,
            methods: true,
            specialMethods: {
                RENDER: {
                    actualName: '__render',
                    required: true
                }
            }
        },
        {
            'VIEW': {
                '': {
                    '(': {
                        'RENDER': {
                            '#': function(cmd) {
                                // VIEW identifier (expr) RENDER (expr2) (expr3) ...
                                if (!cmd.valuePusher) {
                                    cmd.file.errorMeaninglessValue(cmd.parts[0]);
                                }

                                cmd.hasSubblock = true;

                                cmd.processChild = processParams;

                                var params = cooExtractParamValues(cmd, 4);

                                cmd.getCodeBefore = function() {
                                    cooGetDecl(cmd);

                                    var ret = [];

                                    ret.push(COO_INTERNAL_VARIABLE_RET);
                                    ret.push('.push(');
                                    ret.push(cooValueToJS(cmd, cmd.parts[2]));
                                    ret.push('._render(');
                                    ret.push(cooGetParamValues(cmd, params, cmd.data.elemParams));
                                    ret.push('));');

                                    return ret.join('');
                                };
                            }
                        }
                    }
                }
            }
        }
    );

    function processParams(cmd) {
        return cooMatchCommand(cmd, {
            PARAM: {
                '@': function() {
                    return cooProcessParam(cmd, false);
                },

                '(': function() {
                    return cooProcessParam(cmd, true);
                }
            }
        });
    }
})();
