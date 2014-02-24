(function() {
    /* global cooObjectBase */
    /* global cooGetScopeVariablesDecl */
    /* global COO_INTERNAL_VARIABLE_RET */
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
    /* global cooAssertNotValuePusher */
    /* global cooGetDecl */

    function createRouteMethod(actualName) {
        return {
            actualName: actualName,
            allowValues: true,

            extractParams: function(cmd) {
                var params;

                if (cmd.name === 'nomatch') {
                    if (cmd.parts.length > 1) {
                        cmd.file.errorUnexpectedPart(cmd.parts[1]);
                    }

                    if (Object.keys(cmd.root.data.methods).length) {
                        cmd.parts[0].error = 'Either combination of pathname, search and hash or nomatch is possible';
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }
                } else {
                    if ('nomatch' in cmd.root.data.methods) {
                        cmd.parts[0].error = 'Either nomatch or combination of pathname, search and hash is possible';
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

                if (cmd.name === 'nomatch') {
                    cmd.hasSubblock = false;
                }
            },

            getCodeBefore: function(cmd) {
                var tmp;

                if (cmd.name === 'nomatch') {
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
                        ret.push(',');
                    }

                    return ret.join('');
                }
            },

            getCodeAfter: function(cmd) {
                if (cmd.hasSubblock) {
                    var ret;

                    if (cmd.hasRet) {
                        ret = INDENT + 'return CooCoo.unwrap(' + COO_INTERNAL_VARIABLE_RET + ');\n';
                    } else {
                        ret = '';
                    }

                    return ret + '}' + (cmd.last ? '' : ',');
                }
            }
        };
    }

    cooObjectBase(
        {
            cmdName: 'route',
            cmdStorage: 'CooCoo.Route',
            instance: true,
            baseClass: {name: 'CooCoo.RouteBase'},
            getCodeAfterAfter: function(cmd) {
                if (!Object.keys(cmd.data.methods).length) {
                    cmd.parts[0].error = 'Route should have at least one of pathname, search, hash or nomatch';
                    cmd.file.errorUnexpectedPart(cmd.parts[0]);
                }
            }
        },
        {
            specialMethods: {
                pathname: createRouteMethod('pathname'),
                search: createRouteMethod('search'),
                hash: createRouteMethod('hash'),
                nomatch: createRouteMethod('nomatch')
            }
        },
        {
            'route': null
        }
    );


    function routeProcessChoices(cmd) {
        return cooMatchCommand(cmd, {
            'route': {
                '': {
                    '*': function() {
                        // route identifier ...
                        //     ...
                        cooAssertNotValuePusher(cmd);

                        if (cmd.parent.hasOtherwise) {
                            return cmd.parts[0];
                        }

                        cmd.hasSubblock = true;
                        cmd.ignore = true;

                        cmd.parent.data.routes.push(cmd);

                        cooCreateScope(cmd);

                        cmd.getCodeBefore = function() {
                            var ret = [],
                                params = cooExtractParamNames(cmd, cmd.parts, 2);

                            cooGetDecl(cmd);


                            ret.push('{r: CooCoo.Route.' + cmd.parts[1].value + ', c: function(');
                            ret.push(cooGetParamsDecl(params));
                            ret.push(') {');

                            return ret.join('');
                        };

                        cmd.getCodeAfter = function() {
                            var ret = [];
                            ret.push('}}');
                            return ret.join('');
                        };
                    }
                }
            },

            'otherwise': function() {
                // otherwise
                //     ...
                cooAssertNotValuePusher(cmd);

                if (cmd.parent.hasOtherwise) {
                    return cmd.parts[0];
                }

                cmd.parent.hasOtherwise = true;
                cmd.hasSubblock = true;

                cooCreateScope(cmd);

                cmd.getCodeBefore = function() {
                    return 'function() {';
                };

                cmd.getCodeAfter = function() {
                    return '},';
                };
            }
        });
    }


    CooCoo.cmd.routes = {
        process: function(cmd) {
            if (!cmd.parent) {
                return cmd.parts[0];
            }

            return cooMatchCommand(cmd, {
                'routes': function() {
                    // routes
                    //     ...
                    cooAssertNotValuePusher(cmd);
                    cmd.hasSubblock = true;
                    cmd.processChild = routeProcessChoices;

                    cmd.data.routes = [];

                    cmd.getCodeBefore = function() {
                        var ret = [],
                            routes = cmd.data.routes;

                        if (!routes.length) {
                            cmd.parts[0].error = 'No routes';
                            cmd.file.errorUnexpectedPart(cmd.parts[0]);
                        }

                        ret.push('new CooCoo.Routes(this, ');

                        if (!cmd.hasOtherwise) {
                            ret.push('null');
                            if (routes.length) { ret.push(','); }
                        }

                        return ret.join('');
                    };

                    cmd.getCodeAfter = function() {
                        var ret = [],
                            routes = cmd.data.routes,
                            route,
                            i;

                        for (i = 0; i < routes.length; i++) {
                            route = routes[i];
                            route.ignore = false;
                            cooRunGenerators(route, ret, 1);
                            route.ignore = true;
                            if (i < routes.length - 1) {
                                ret[ret.length - 1] += ',';
                            }
                        }

                        ret.push(');');

                        return ret.join('\n');
                    };
                }
            });
        },
        arrange: null
    };
})();
