(function() {
    /* global cooObjectBase */
    /* global cooGetScopeVariablesDecl */
    /* global cooGetScopeRet */
    /* global COO_COMMAND_PART_STRING */
    /* global COO_COMMAND_PART_JS */
    /* global COO_COMMAND_PART_IDENTIFIER */
    /* global cooExtractParamNames */
    /* global cooPushScopeVariable */
    /* global INDENT */
    /* global cooRunGenerators */
    /* global cooCreateScope */
    /* global cooMatchCommand */
    /* global cooGetParamsDecl */

    var routeId = 0;

    function createRouteMethod(actualName) {
        return {
            actualName: actualName,
            allowValues: true,

            extractParams: function(cmd) {
                var params;

                if (cmd.name === 'NOMATCH') {
                    if (cmd.parts.length > 1) {
                        cmd.file.errorUnexpectedPart(cmd.parts[1]);
                    }

                    if (Object.keys(cmd.root.data.methods).length) {
                        cmd.parts[0].error = 'Either combination of PATHNAME, SEARCH and HASH or NOMATCH is possible';
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }
                } else {
                    if ('nomatch' in cmd.root.data.methods) {
                        cmd.parts[0].error = 'Either NOMATCH or combination of PATHNAME, SEARCH and HASH is possible';
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }
                }

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

                if (cmd.name === 'NOMATCH') {
                    cmd.hasSubblock = false;
                }
            },

            getCodeBefore: function(cmd) {
                var tmp;

                if (cmd.name === 'NOMATCH') {
                    return actualName + ': true' + (cmd.last ? '' : ',');
                } else if (cmd.hasSubblock) {
                    tmp = cooGetScopeVariablesDecl(cmd);

                    if (tmp === '') {
                        cmd.parts[0].error = 'No value';
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }

                    return actualName + ': function(' + (cmd.parts[1] ? cmd.parts[1].value : '') + ') {' + tmp;
                } else {
                    var ret = [];

                    ret.push(actualName);
                    ret.push(': ');

                    if (cmd.parts[1].type !== COO_COMMAND_PART_JS) {
                        ret.push('new RegExp(');
                    }

                    ret.push(cmd.parts[1].value);

                    if (cmd.parts[1].type !== COO_COMMAND_PART_JS) {
                        ret.push(')');
                    }

                    if (!cmd.last) {
                        ret.push(',')
                    }

                    return ret.join('');
                }
            },

            getCodeAfter: function(cmd) {
                if (cmd.hasSubblock) {
                    return cooGetScopeRet(cmd) + '}' + (cmd.last ? '' : ',');
                }
            }
        };
    }

    cooObjectBase(
        {
            cmdName: 'ROUTE',
            cmdStorage: 'CooCoo.Route',
            baseClass: {name: 'CooCoo.RouteBase'},
            getCodeBeforeAfter: function(cmd) {
                var ret = [];

                if (cmd.debug) {
                    ret.push('\n');
                }

                ret.push(INDENT);
                ret.push('id: ');
                ret.push(++routeId);
                ret.push(',');

                return ret.join('');
            },

            getCodeAfterAfter: function(cmd) {
                var ret = [];

                if (!Object.keys(cmd.data.methods).length) {
                    cmd.parts[0].error = 'Route should have at least one of PATHNAME, SEARCH, HASH or NOMATCH';
                    cmd.file.errorUnexpectedPart(cmd.parts[0]);
                }

                ret.push('new CooCoo.Route.');
                ret.push(cmd.parts[1].value);
                ret.push('();\n');

                return ret.join('');
            }
        },
        {
            specialMethods: {
                PATHNAME: createRouteMethod('pathname'),
                SEARCH: createRouteMethod('search'),
                HASH: createRouteMethod('hash'),
                NOMATCH: createRouteMethod('nomatch')
            }
        },
        {
            'ROUTE': {
                '': function(cmd) {
                    cmd.hasSubblock = true;

                    cmd.processChild = matchOnOff;

                    cmd.getCodeBefore = function() {
                        if (!cmd.data.on) {
                            cmd.parts[0].error = 'Missing ON declaration';
                            cmd.file.errorUnexpectedPart(cmd.parts[0]);
                        }

                        if (!cmd.data.off) {
                            cmd.parts[0].error = 'Missing OFF declaration';
                            cmd.file.errorUnexpectedPart(cmd.parts[0]);
                        }

                        var ret = [];

                        ret.push('new CooCoo.Route.' + cmd.parts[1].value + '(this, ');

                        cmd.data.on.ignore = false;
                        cooRunGenerators(cmd.data.on, ret, 1);
                        cmd.data.on.ignore = true;

                        ret[ret.length - 1] += ',';

                        cmd.data.off.ignore = false;
                        cooRunGenerators(cmd.data.off, ret, 1);
                        cmd.data.off.ignore = true;

                        ret.push(');');

                        return ret.join('\n');
                    };

                    cmd.getCodeAfter = function() {

                    };
                }
            }
        }
    );


    function processOnOff(cmd) {
        cmd.ignore = true;
        cmd.hasSubblock = true;
        cmd.valueRequired = false;

        cooCreateScope(cmd);

        var params = cooExtractParamNames(cmd, cmd.parts, 1),
            p;

        for (p in params) {
            cooPushScopeVariable(cmd, p, false);
        }

        cmd.getCodeBefore = function() {
            var ret = [];

            ret.push('function(');
            ret.push(cooGetParamsDecl(params));
            ret.push(') {');
            ret.push(cooGetScopeVariablesDecl(cmd));

            return ret.join('');
        };

        cmd.getCodeAfter = function() {
            return '}';
        };
    }


    function matchOnOff(cmd) {
        return cooMatchCommand(cmd, {
            'ON': {
                '*': function() {
                    if (cmd.parent.data.on) {
                        cmd.parts[0].error = 'Duplicate ON declaration';
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }

                    cmd.parent.data.on = cmd;

                    processOnOff(cmd);
                }
            },

            'OFF': {
                '*': function() {
                    if (cmd.parent.data.off) {
                        cmd.parts[0].error = 'Duplicate OFF declaration';
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }

                    cmd.parent.data.off = cmd;

                    processOnOff(cmd);
                }
            }
        });
    }
})();
