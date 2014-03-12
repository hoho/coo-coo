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

    function getEachHandler(self) {
        return function processEach(cmd) {
            // collection identifier (expr) each identifier
            // this each identifier
            cmd.hasSubblock = true;
            cooAssertNotValuePusher(cmd);

            cooCreateScope(cmd);
            cooPushScopeVariable(cmd, cmd.parts[self ? 2 : 4].value, false, true);

            cmd.getCodeBefore = function() {
                if (!self) {
                    cooGetDecl(cmd);
                }

                var ret = [];

                ret.push(self ? 'this' : cooValueToJS(cmd, cmd.parts[2]));
                ret.push('.each(function(');
                ret.push(cmd.parts[self ? 2 : 4].value);
                ret.push(') {');
                ret.push(cooGetScopeVariablesDecl(cmd));

                return ret.join('');
            };

            cmd.getCodeAfter = function() {
                var ret = [];

                ret.push('}');
                ret.push(', this');
                if (cmd.parts[self ? 3 : 5]) {
                    ret.push(', function(');
                    ret.push(cmd.parts[self ? 2 : 4].value);
                    ret.push(') { return ');
                    ret.push(cooValueToJS(cmd, cmd.parts[self ? 3 : 5]));
                    ret.push('; }');
                }
                ret.push(');');

                return ret.join('');
            };
        };
    }


    function getAddHandlers(self) {
        return {
            '@': function(cmd) {
                // collection identifier (expr) add
                //     ...
                // this add
                //     ...
                cmd.hasSubblock = true;
                cmd.valueRequired = true;

                cooAssertNotValuePusher(cmd);

                return cooProcessBlockAsValue(cmd, {
                    getCodeBeforeBefore: function() {
                        if (!self) {
                            cooGetDecl(cmd);
                        }

                        return (self ? 'this' : cooValueToJS(cmd, cmd.parts[2])) + '.add(';
                    },

                    getCodeAfterAfter: function() {
                        return ');';
                    }
                });
            },

            '(': function(cmd) {
                // collection identifier (expr) add (expr2)
                // this add (expr)
                cooAssertNotValuePusher(cmd);

                cmd.getCodeBefore = function() {
                    if (!self) {
                        cooGetDecl(cmd);
                    }

                    var ret = [];

                    ret.push(self ? 'this' : cooValueToJS(cmd, cmd.parts[2]));
                    ret.push('.add(');
                    ret.push(cooValueToJS(cmd, cmd.parts[self ? 2 : 4]));
                    ret.push(');');

                    return ret.join('');
                };
            }
        };
    }


    function getLengthHandler(self) {
        return function(cmd) {
            // collection identifier (expr) length
            // this length
            cooAssertValuePusher(cmd);

            cmd.getCodeBefore = function() {
                if (!self) {
                    cooGetDecl(cmd);
                }

                var ret = [],
                    retWrap = cooWrapRet(cmd);

                ret.push(retWrap[0]);

                if (!self) {
                    ret.push(cooWrapWithTypeCheck(
                        cmd,
                        cmd.parts[2],
                        'val instanceof CooCoo.Collection.' + cmd.parts[1].value,
                        cooValueToJS(cmd, cmd.parts[2])
                    ));
                } else {
                    ret.push('this');
                }

                ret.push('.length');
                ret.push(retWrap[1]);

                return ret.join('');
            };
        };
    }


    function getFindHandler(self) {
        return {
            '': {
                '(': function processEach(cmd) {
                    // collection identifier (expr) find identifier (expr)
                    // this find identifier (expr)
                    cooAssertValuePusher(cmd);

                    cooCreateScope(cmd);
                    cooPushScopeVariable(cmd, cmd.parts[self ? 2 : 4].value, false, true);

                    cmd.getCodeBefore = function() {
                        if (!self) {
                            cooGetDecl(cmd);
                        }

                        var ret = [],
                            retWrap = cooWrapRet(cmd);

                        ret.push(retWrap[0]);
                        ret.push(self ? 'this' : cooValueToJS(cmd, cmd.parts[2]));
                        ret.push('.find(function(');
                        ret.push(cmd.parts[self ? 2 : 4].value);
                        ret.push(') { return ');
                        ret.push(cooValueToJS(cmd, cmd.parts[self ? 3 : 5]));
                        ret.push('; }, this)');
                        ret.push(retWrap[1]);

                        return ret.join('');
                    };
                }
            }
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
                        'add': getAddHandlers(false),

                        'each': {
                            '': {
                                '@': getEachHandler(false),
                                '(': getEachHandler(false)
                            }
                        },

                        'length': getLengthHandler(false),

                        'find': getFindHandler(false)
                    }
                }
            },

            'this': {
                'add': getAddHandlers(true),

                'each': {
                    '': {
                        '@': getEachHandler(true),
                        '(': getEachHandler(true)
                    }
                },

                'length': getLengthHandler(true),

                'find': getFindHandler(true)
            }
        }
    );
})();
