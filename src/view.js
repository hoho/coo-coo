(function() {
    /* global cooObjectBase */
    /* global cooExtractParamValues */
    /* global cooWrapRet */
    /* global cooValueToJS */
    /* global cooGetDecl */
    /* global cooGetParamValues */
    /* global cooAssertValuePusher */
    /* global cooProcessParams */


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
                                cooAssertValuePusher(cmd);

                                cmd.hasSubblock = true;
                                cmd.processChild = cooProcessParams;

                                var params = cooExtractParamValues(cmd, 4);

                                cmd.getCodeBefore = function() {
                                    cooGetDecl(cmd);

                                    var ret = [],
                                        retWrap = cooWrapRet(cmd);

                                    ret.push(retWrap[0]);
                                    ret.push(cooValueToJS(cmd, cmd.parts[2]));
                                    ret.push('._render(');
                                    ret.push(cooGetParamValues(cmd, params, cmd.data.elemParams));
                                    ret.push(')');
                                    ret.push(retWrap[1]);

                                    return ret.join('');
                                };
                            }
                        }
                    }
                }
            }
        }
    );
})();
