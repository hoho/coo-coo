(function() {
    /* global cooMatchCommand */
    /* global cooCreateScope */
    /* global cooPushScopeVariable */
    /* global cooPushThisVariable */
    /* global cooGetScopeVariablesDecl */
    /* global cooGetScopeRet */
    /* global COO_INTERNAL_VARIABLE_THIS */
    /* global COO_INTERNAL_VARIABLE_RET */
    /* global COO_COMMAND_PART_PROPERTY_GETTER */
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
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;

                        cooCreateScope(cmd);
                        cooPushThisVariable(cmd);
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
                            ret.push(' = (function() {');
                            ret.push(cooGetScopeVariablesDecl(cmd));

                            return ret.join('');
                        };

                        cmd.getCodeAfter = function() {
                            var ret = [];

                            ret.push(cooGetScopeRet(cmd));
                            ret.push('}).call(');
                            ret.push(COO_INTERNAL_VARIABLE_THIS);

                            if (cmd.valuePusher) {
                                ret.push(')');
                            }

                            ret.push(');');

                            return ret.join('');
                        };
                    },

                    '(': function() {
                        // SET identifier (expr)
                        var name = cmd.parts[1].value,
                            val = cmd.parts[2];

                        cooPushScopeVariable(cmd, name);

                        if (val.type === COO_COMMAND_PART_PROPERTY_GETTER) {
                            cooPushThisVariable(cmd);
                        }

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
