(function() {
    /* global cooObjectBase */
    /* global cooExtractParamValues */
    /* global cooWrapRet */
    /* global cooValueToJS */
    /* global cooGetDecl */
    /* global cooGetParamValues */
    /* global cooProcessParams */
    /* global cooProcessCreateCommand */
    /* global COO_COMMAND_PART_IDENTIFIER */

    function renderHandler(cmd) {
        // view identifier (expr) render (expr2) (expr3) ...
        // view (expr) render (expr2) (expr3) ...

        var partsOffset = cmd.parts[1].type === COO_COMMAND_PART_IDENTIFIER ? 1 : 0;

        //cooAssertValuePusherOrDOMPusher(cmd);
        cmd.isRender = true;
        cmd.hasSubblock = true;
        cmd.processChild = cooProcessParams;

        cmd.getCodeBefore = function() {
            if (partsOffset) { cooGetDecl(cmd); }

            var ret = [],
                retWrap = cooWrapRet(cmd),
                params = cooExtractParamValues(cmd, 3 + partsOffset);

            ret.push(retWrap[0]);
            ret.push(cooValueToJS(cmd, cmd.parts[1 + partsOffset]));
            ret.push('._render(');
            ret.push(cooGetParamValues(cmd, params, cmd.data.elemParams));
            ret.push(')');
            ret.push(retWrap[1]);

            return ret.join('');
        };
    }

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
                            '#': renderHandler
                        }
                    },

                    'render': {
                        '#': function(cmd) {
                            // view identifier render (expr2) (expr3) ...
                            //cooAssertValuePusherOrDOMPusher(cmd);
                            cmd.isRender = true;
                            cooProcessCreateCommand(cmd, 3, undefined, {}, true);
                        }
                    }
                },

                '(': {
                    'render': {
                        '#': renderHandler
                    }
                }
            }
        }
    );
})();
