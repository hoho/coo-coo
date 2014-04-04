(function() {
    /* global cooObjectBase */
    /* global cooGetScopeVariablesDecl */
    /* global cooGetScopeRet */
    /* global cooProcessBlockAsValue */
    /* global cooValueToJS */
    /* global cooAssertNotRetPusher */
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooGetDecl */
    /* global cooAssertRetPusher */
    /* global cooWrapWithTypeCheck */
    /* global cooWrapRet */

    function getEachHandler(self) {
        return function processEach(cmd) {
            // collection identifier (expr) each $var
            // this each $var
            cmd.hasSubblock = true;
            cooAssertNotRetPusher(cmd);

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

                //cooAssertShouldBeHolder(cmd);
                cooAssertNotRetPusher(cmd);

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
                cooAssertNotRetPusher(cmd);

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
            cooAssertRetPusher(cmd);

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
            '($)': {
                '(': function processEach(cmd) {
                    // collection identifier (expr) find $var (expr)
                    // this find $var (expr)
                    cooAssertRetPusher(cmd);

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


    function getActivateHandler(self) {
        return function(cmd) {
            // collection identifier (expr) activate (name) (model) (true?)
            // this activate (name) (model) (true?)
            cooAssertNotRetPusher(cmd);

            cmd.getCodeBefore = function() {
                if (!self) {
                    cooGetDecl(cmd);
                }

                var ret = [],
                    partOffset = self ? 0 : 2;

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

                ret.push('.activate(');

                ret.push(cooValueToJS(cmd, cmd.parts[2 + partOffset]));
                ret.push(', true, ');
                ret.push(cooValueToJS(cmd, cmd.parts[3 + partOffset]));

                if (cmd.parts[4 + partOffset]) {
                    ret.push(', ');
                    ret.push(cooValueToJS(cmd, cmd.parts[4 + partOffset]));
                }

                ret.push(');');

                return ret.join('');
            };
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

                    getPatterns: function(callback) {
                        return {
                            '@': function(cmd) { cmd.hasSubblock = true; return callback(); },
                            '': function() { return callback(); }
                        };
                    },

                    extractParams: function(cmd) {
                        var ret = {};

                        if (cmd.parts[1]) {
                            ret[cmd.parts[1].value] = true;
                        }

                        return ret;
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
                        'activate': {
                            '(': {
                                '(': {
                                    '@': getActivateHandler(false),
                                    '(': getActivateHandler(false)
                                }
                            }
                        },

                        'add': getAddHandlers(false),

                        'each': {
                            '($)': {
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
                'activate': {
                    '(': {
                        '(': {
                            '@': getActivateHandler(true),
                            '(': getActivateHandler(true)
                        }
                    }
                },

                'add': getAddHandlers(true),

                'each': {
                    '($)': {
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
