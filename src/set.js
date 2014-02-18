(function() {
    /* global cooMatchCommand */
    /* global cooPushScopeVariable */
    /* global cooWrapRet */
    /* global cooValueToJS */
    /* global cooAssertNotValuePusher */
    /* global cooProcessBlockAsValue */

    function setFromBody(cmd) {
        // set identifier
        //     ...
        cooAssertNotValuePusher(cmd);
        cooPushScopeVariable(cmd.parent, cmd.parts[1].value);

        return cooProcessBlockAsValue(cmd, {
            getCodeBeforeBefore: function() {
                var ret = [];
                ret.push(cmd.parts[1].value);
                ret.push(' = CooCoo.');
                if (cmd.parts[0].value === 'reset') {
                    ret.push('reset');
                } else {
                    ret.push('unwrap');
                }
                ret.push('(');
                return ret.join('');
            },

            getCodeAfterAfter: function() {
                var ret = [];
                if (cmd.parts[0].value === 'reset') {
                    ret.push(', ');
                    ret.push(cmd.parts[1].value);
                }
                ret.push(');');
                return ret.join('');
            }
        });
    }


    function setFromExpr(cmd) {
        // set identifier (expr)
        var name = cmd.parts[1].value,
            val = cmd.parts[2];

        cooAssertNotValuePusher(cmd);
        cooPushScopeVariable(cmd, name);

        cmd.getCodeBefore = function() {
            var ret = [],
                retWrap = cooWrapRet(cmd);

            ret.push(retWrap[0]);
            ret.push(name);
            ret.push(' = CooCoo.');
            if (cmd.parts[0].value === 'reset') {
                ret.push('reset');
            } else {
                ret.push('unwrap');
            }
            ret.push('(');
            ret.push(cooValueToJS(cmd, val));
            if (cmd.parts[0].value === 'reset') {
                ret.push(', ');
                ret.push(name);
            }
            ret.push(')');
            ret.push(retWrap[1]);

            return ret.join('');
        };
    }


    function setProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'set': {
                '': {
                    '@': setFromBody,
                    '(<': setFromExpr
                }
            },

            'reset': {
                '': {
                    '@': setFromBody,
                    '(<': setFromExpr
                }
            }
        });
    }


    CooCoo.cmd.set = CooCoo.cmd.reset = {
        process: setProcess,
        arrange: null
    };
})();
