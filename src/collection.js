(function() {
    /* global cooObjectBase */
    /* global cooMatchCommand */
    /* global cooGetScopeVariablesDecl */
    /* global cooGetScopeRet */
    /* global cooProcessBlockAsValue */
    /* global cooValueToJS */
    /* global cooAssertNotValuePusher */
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooGetDecl */
    /* global cooAssertValuePusher */
    /* global cooWrapWithTypeCheck */
    /* global COO_INTERNAL_VARIABLE_RET */

    cooObjectBase(
        {
            cmdName: 'COLLECTION',
            cmdStorage: 'CooCoo.Collection',
            baseClass: {name: 'CooCoo.CollectionBase'}
        },
        {
            init: true,
            properties: true,
            methods: true,
            specialMethods: {
                MODEL: {
                    actualName: 'model',
                    required: true,

                    tuneCommand: function(cmd) {
                        return cooMatchCommand(cmd, {
                            'MODEL': {
                                '@': function() {
                                    cmd.hasSubblock = true;
                                    cmd.valueRequired = true;
                                },

                                '': function() {
                                    cmd.hasSubblock = false;
                                }
                            }
                        });
                    },

                    getCodeBefore: function(cmd) {
                        var tmp;

                        if (cmd.hasSubblock) {
                            tmp = cooGetScopeVariablesDecl(cmd);

                            if (tmp === '') {
                                cmd.parts[0].error = 'Model has no value';
                                cmd.file.errorUnexpectedPart(cmd.parts[0]);
                            }

                            return 'model: function() {' + tmp;
                        } else {
                            tmp = cmd.parts[1].value;

                            if (!cmd.decls.MODEL || !cmd.decls.MODEL[tmp]) {
                                cmd.parts[1].error = 'Undeclared model';
                                cmd.file.errorUnexpectedPart(cmd.parts[1]);
                            }

                            return 'model: CooCoo.Model.' + tmp + (cmd.last ? '' : ',\n');
                        }
                    },

                    getCodeAfter: function(cmd) {
                        if (cmd.hasSubblock) {
                            return cooGetScopeRet(cmd) + '}' + (cmd.last ? '' : ',\n');
                        }
                    }
                }
            }
        },
        {
            'COLLECTION': {
                '': {
                    '(': {
                        'ADD': {
                            '@': function(cmd) {
                                // COLLECTION identifier (expr) ADD
                                //     ...
                                cmd.hasSubblock = true;
                                cmd.valueRequired = true;

                                cooAssertNotValuePusher(cmd);

                                return cooProcessBlockAsValue(cmd, {
                                    getCodeBeforeBefore: function() {
                                        cooGetDecl(cmd);

                                        return cooValueToJS(cmd, cmd.parts[2]) + '.add(';
                                    },

                                    getCodeAfterAfter: function() {
                                        return ');';
                                    }
                                });
                            },

                            '(': function(cmd) {
                                // COLLECTION identifier (expr) ADD (expr2)
                                cooAssertNotValuePusher(cmd);

                                cmd.getCodeBefore = function() {
                                    cooGetDecl(cmd);

                                    var ret = [];

                                    ret.push(cooValueToJS(cmd, cmd.parts[2]));
                                    ret.push('.add(');
                                    ret.push(cooValueToJS(cmd, cmd.parts[4]));
                                    ret.push(');');

                                    return ret.join('');
                                };
                            }
                        },

                        'EACH': {
                            '': function(cmd) {
                                // COLLECTION identifier (expr) EACH identifier
                                cmd.hasSubblock = true;
                                cooAssertNotValuePusher(cmd);

                                cooCreateScope(cmd);
                                cooPushScopeVariable(cmd, cmd.parts[4].value, false);

                                cmd.getCodeBefore = function() {
                                    cooGetDecl(cmd);

                                    var ret = [];

                                    ret.push(cooValueToJS(cmd, cmd.parts[2]));
                                    ret.push('.each(function(');
                                    ret.push(cmd.parts[4].value);
                                    ret.push(') {');

                                    return ret.join('');
                                };

                                cmd.getCodeAfter = function() {
                                    return '}, this);';
                                };
                            }
                        },

                        'LENGTH': function(cmd) {
                            // COLLECTION identifier (expr) LENGTH
                            cooAssertValuePusher(cmd);

                            cmd.getCodeBefore = function() {
                                cooGetDecl(cmd);

                                var ret = [];

                                ret.push(COO_INTERNAL_VARIABLE_RET);
                                ret.push('.push(');

                                ret.push(cooWrapWithTypeCheck(
                                    cmd,
                                    cmd.parts[2],
                                    cooValueToJS(cmd, cmd.parts[2]),
                                    'val instanceof CooCoo.Collection.' + cmd.parts[1].value
                                ));

                                ret.push('.length()');
                                ret.push(');');

                                return ret.join('');
                            };
                        }
                    }
                }
            }
        }
    );
})();
