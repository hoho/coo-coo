(function() {
    /* global cooObjectBase */
    /* global cooGetScopeVariablesDecl */
    /* global cooGetScopeRet */
    /* global COO_COMMAND_PART_STRING */
    /* global COO_COMMAND_PART_JS */
    /* global COO_COMMAND_PART_IDENTIFIER */
    /* global cooExtractParamNames */
    /* global cooPushScopeVariable */

    function createRouteMethod(actualName) {
        return {
            actualName: actualName,
            allowValues: true,

            extractParams: function(cmd) {
                var params;

                if (cmd.parts.length > 1) {
                    if (cmd.parts[1].type === COO_COMMAND_PART_STRING ||
                        cmd.parts[1].type === COO_COMMAND_PART_JS)
                    {
                        params = {};
                    } else if (cmd.parts[1].type === COO_COMMAND_PART_IDENTIFIER) {
                        params = cooExtractParamNames(cmd, cmd.parts, 1);

                        for (var p in params) {
                            cooPushScopeVariable(cmd, p, false);
                        }
                    } else {
                        cmd.file.errorUnexpectedPart(cmd.parts[1]);
                    }
                }

                if (cmd.parts.length > 2) {
                    cmd.file.errorUnexpectedPart(cmd.parts[2]);
                }

                return params;
            },

            tuneCommand: function(cmd) {
                if (cmd.parts[1] && cmd.parts[1].type !== COO_COMMAND_PART_IDENTIFIER) {
                    cmd.hasSubblock = false;
                }
            },

            getCodeBefore: function(cmd) {
                var tmp;

                if (cmd.hasSubblock) {
                    tmp = cooGetScopeVariablesDecl(cmd);

                    if (tmp === '') {
                        cmd.parts[0].error = 'No value';
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }

                    return actualName + ': function(' + (cmd.parts[1] ? cmd.parts[1].value : '') + ') {' + tmp;
                } else {
                    return actualName + ': new RegExp(' + cmd.parts[1].value + ')' + (cmd.last ? '' : ',\n');
                }
            },

            getCodeAfter: function(cmd) {
                if (cmd.hasSubblock) {
                    return cooGetScopeRet(cmd) + '}' + (cmd.last ? '' : ',\n');
                }
            }
        };
    }

    cooObjectBase(
        'ROUTE',
        'CooCoo.Route',
        {name: 'CooCoo.RouteBase'},
        {
            specialMethods: {
                PATHNAME: createRouteMethod('pathname'),
                SEARCH: createRouteMethod('search'),
                HASH: createRouteMethod('hash')
            }
        },
        {
            'ROUTE': {
            }
        }
    );
})();
