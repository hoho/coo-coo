(function() {
    /* global cooMatchCommand */

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
                    },

                    '(': function() {
                        // SET identifier (expr)
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
