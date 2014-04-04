(function() {
    /* global cooObjectBase */
    /* global cooAssertNotRetPusher */
    /* global cooGetDecl */
    /* global cooWrapWithTypeCheck */
    /* global cooValueToJS */

    function getActivateHandler(self) {
        return function(cmd) {
            // model identifier (expr) activate (name) (true?)
            // this activate (name) (true?)
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
                            'val instanceof CooCoo.Model.' + cmd.parts[1].value,
                        cooValueToJS(cmd, cmd.parts[2])
                    ));
                } else {
                    ret.push('this');
                }

                ret.push('.activate(');

                ret.push(cooValueToJS(cmd, cmd.parts[2 + partOffset]));

                ret.push(', true');

                if (cmd.parts[3 + partOffset]) {
                    ret.push(', ');
                    ret.push(cooValueToJS(cmd, cmd.parts[3 + partOffset]));
                }

                ret.push(');');

                return ret.join('');
            };
        };
    }


    cooObjectBase(
        {
            cmdName: 'model',
            cmdStorage: 'CooCoo.Model',
            baseClass: {name: 'CooCoo.ModelBase'}
        },
        {
            init: true,
            properties: true,
            methods: true
        },
        {
            'model': {
                '': {
                    '(': {
                        'activate': {
                            '(': {
                                '@': getActivateHandler(false),
                                '(': getActivateHandler(false)
                            }
                        }
                    }
                }
            },

            'this': {
                'activate': {
                    '(': {
                        '@': getActivateHandler(true),
                        '(': getActivateHandler(true)
                    }
                }
            }
        }
    );
})();
