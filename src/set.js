(function() {
    /* global cooMatchCommand */
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooGetScopeVariablesDecl */
    /* global cooGetScopeRet */
    /* global COO_INTERNAL_VARIABLE_RET */
    /* global cooValueToJS */

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
                        if (cmd.valuePusher) {
                            cmd.file.errorNoValue(cmd.parts[0]);
                        }

                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;

                        cooCreateScope(cmd);
                        cooPushScopeVariable(cmd.parent, cmd.parts[1].value);

                        cmd.getCodeBefore = function() {
                            if (!cmd.children.length) {
                                return;
                            }

                            var ret = [];

                            if (cmd.valuePusher) {
                                ret.push(COO_INTERNAL_VARIABLE_RET);
                                ret.push('.push(');
                            }

                            ret.push(cmd.parts[1].value);
                            ret.push(' = CooCooRet((function() {');
                            ret.push(cooGetScopeVariablesDecl(cmd));

                            return ret.join('');
                        };

                        cmd.getCodeAfter = function() {
                            var ret = [];

                            ret.push(cooGetScopeRet(cmd));
                            ret.push('}).call(this');

                            if (cmd.valuePusher) {
                                ret.push(')');
                            }

                            ret.push(')).valueOf();');

                            return ret.join('');
                        };
                    },

                    '(': function() {
                        // SET identifier (expr)
                        var name = cmd.parts[1].value,
                            val = cmd.parts[2];

                        cooPushScopeVariable(cmd, name);

                        cmd.getCodeBefore = function() {
                            var ret = [];

                            if (cmd.valuePusher) {
                                ret.push(COO_INTERNAL_VARIABLE_RET);
                                ret.push('.push(');
                            }

                            ret.push(name);
                            ret.push(' = ');
                            ret.push(cooValueToJS(cmd, val));

                            if (cmd.valuePusher) {
                                ret.push(')');
                            }

                            ret.push(';');

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
