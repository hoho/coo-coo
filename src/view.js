(function() {
    /* global cooObjectBase */
    /* global cooExtractParamValues */
    /* global cooWrapRet */
    /* global cooValueToJS */
    /* global cooGetDecl */
    /* global cooGetParamValues */
    /* global cooAssertValuePusher */
    /* global cooProcessParams */
    /* global cooProcessCreateCommand */


    cooObjectBase(
        {
            cmdName: 'view',
            cmdStorage: 'CooCoo.View',
            baseClass: {name: 'CooCoo.ViewBase'},
            isView: true
        },
        {
            init: true,
            properties: true,
            methods: true,
            specialMethods: {
                'render': {
                    actualName: '__render',
                    required: true,
                    renderRet: true
                }
            }
        },
        {
            'view': {
                '': {
                    '(': {
                        'render': {
                            '#': function(cmd) {
                                // view identifier (expr) render (expr2) (expr3) ...
                                cooAssertValuePusher(cmd);

                                cmd.hasSubblock = true;
                                cmd.processChild = cooProcessParams;

                                cmd.getCodeBefore = function() {
                                    cooGetDecl(cmd);

                                    var ret = [],
                                        retWrap = cooWrapRet(cmd),
                                        params = cooExtractParamValues(cmd, 4);

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
                    },

                    'render': {
                        '#': function(cmd) {
                            // view identifier render (expr2) (expr3) ...
                            cooAssertValuePusher(cmd);

                            cmd.isRender = true;

                            cooProcessCreateCommand(cmd, 3, undefined, {}, true);
                        }
                    }
                }
            }
        }
    );
})();
