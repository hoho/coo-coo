(function() {
    /* global cooMatchCommand */
    /* global cooPushScopeVariable */

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

                        cooPushScopeVariable(cmd, cmd.parts[1].value);
                    },

                    '(': function() {
                        // SET identifier (expr)
                        cooPushScopeVariable(cmd, cmd.parts[1].value);
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
