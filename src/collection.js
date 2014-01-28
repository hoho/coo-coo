(function() {
    /* global cooObjectBase */
    /* global cooMatchCommand */
    /* global cooGetScopeVariablesDecl */
    /* global cooGetScopeRet */
    /* global cooProcessBlockAsValue */
    /* global cooValueToJS */

    cooObjectBase(
        {
            cmdName: 'COLLECTION',
            cmdStorage: 'CooCoo.Collection',
            baseClass: {name: 'CooCoo.CollectionBase'}
        },
        {
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

                                return cooProcessBlockAsValue(cmd, {
                                    getCodeBeforeBefore: function() {
                                        return cooValueToJS(cmd, cmd.parts[2]) + '.add(';
                                    },

                                    getCodeAfterAfter: function() {
                                        return ');';
                                    }
                                });
                            },

                            '(': function(cmd) {
                                // COLLECTION identifier (expr) ADD (expr2)
                                cmd.file.errorNotImplemented(cmd.parts[0]);
                            }
                        }
                    }
                }
            }
        }
    );
})();
