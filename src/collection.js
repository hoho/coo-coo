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
    /* global cooWrapRet */

    function processEach(cmd) {
        // collection identifier (expr) each identifier
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
            ret.push(cooGetScopeVariablesDecl(cmd));

            return ret.join('');
        };

        cmd.getCodeAfter = function() {
            var ret = [];

            ret.push('}');
            ret.push(', this');
            if (cmd.parts[5]) {
                ret.push(', function(');
                ret.push(cmd.parts[4].value);
                ret.push(') { return ');
                ret.push(cooValueToJS(cmd, cmd.parts[5]));
                ret.push('; }');
            }
            ret.push(');');

            return ret.join('');
        };
    }

    cooObjectBase(
        {
            cmdName: 'collection',
            cmdStorage: 'CooCoo.Collection',
            baseClass: {name: 'CooCoo.CollectionBase'}
        },
        {
            init: true,
            properties: true,
            methods: true,
            specialMethods: {
                'model': {
                    actualName: 'model',
                    required: true,

                    tuneCommand: function(cmd) {
                        return cooMatchCommand(cmd, {
                            'model': {
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

                            if (!cmd.decls.model || !cmd.decls.model[tmp]) {
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
            'collection': {
                '': {
                    '(': {
                        'add': {
                            '@': function(cmd) {
                                // collection identifier (expr) add
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
                                // collection identifier (expr) add (expr2)
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

                        'each': {
                            '': {
                                '@': processEach,
                                '(': processEach
                            }
                        },

                        'length': function(cmd) {
                            // collection identifier (expr) length
                            cooAssertValuePusher(cmd);

                            cmd.getCodeBefore = function() {
                                cooGetDecl(cmd);

                                var ret = [],
                                    retWrap = cooWrapRet(cmd);

                                ret.push(retWrap[0]);
                                ret.push(cooWrapWithTypeCheck(
                                    cmd,
                                    cmd.parts[2],
                                    'val instanceof CooCoo.Collection.' + cmd.parts[1].value,
                                    cooValueToJS(cmd, cmd.parts[2])
                                ));
                                ret.push('.length');
                                ret.push(retWrap[1]);

                                return ret.join('');
                            };
                        },

                        'find': {
                            '': {
                                '(': function processEach(cmd) {
                                    // collection identifier (expr) find identifier (expr)
                                    cooAssertValuePusher(cmd);

                                    cooCreateScope(cmd);
                                    cooPushScopeVariable(cmd, cmd.parts[4].value, false);

                                    cmd.getCodeBefore = function() {
                                        cooGetDecl(cmd);

                                        var ret = [],
                                            retWrap = cooWrapRet(cmd);

                                        ret.push(retWrap[0]);
                                        ret.push(cooValueToJS(cmd, cmd.parts[2]));
                                        ret.push('.find(function(');
                                        ret.push(cmd.parts[4].value);
                                        ret.push(') { return ');
                                        ret.push(cooValueToJS(cmd, cmd.parts[5]));
                                        ret.push('; }, this)');
                                        ret.push(retWrap[1]);

                                        return ret.join('');
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }
    );
})();
