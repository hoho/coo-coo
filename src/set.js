(function() {
    /* global cooMatchCommand */
    /* global cooPushScopeVariable */
    /* global cooWrapRet */
    /* global cooValueToJS */
    /* global cooAssertNotValuePusher */
    /* global cooProcessBlockAsValue */

    function setProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'SET': {
                '': {
                    '@': function() {
                        // SET identifier
                        //     ...
                        cooAssertNotValuePusher(cmd);
                        cooPushScopeVariable(cmd.parent, cmd.parts[1].value);

                        return cooProcessBlockAsValue(cmd, {
                            getCodeBeforeBefore: function() {
                                return cmd.parts[1].value + ' = cooUnwrap(';
                            },

                            getCodeAfterAfter: function() {
                                return ');';
                            }
                        });
                    },

                    '(<': function() {
                        // SET identifier (expr)
                        var name = cmd.parts[1].value,
                            val = cmd.parts[2];

                        cooAssertNotValuePusher(cmd);
                        cooPushScopeVariable(cmd, name);

                        cmd.getCodeBefore = function() {
                            var ret = [],
                                retWrap = cooWrapRet(cmd);

                            ret.push(retWrap[0]);
                            ret.push(name);
                            ret.push(' = cooUnwrap(');
                            ret.push(cooValueToJS(cmd, val));
                            ret.push(')');
                            ret.push(retWrap[1]);

                            return ret.join('');
                        };
                    }
                }
            }
        });
    }


    CooCoo.cmd.SET = {
        process: setProcess,
        arrange: null
    };
})();
