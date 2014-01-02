(function() {
    /* global cooMatchCommand */

    function setProcess(cmd) {
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
                    },

                    '"': function() {
                        // SET identifier "text"
                    }
                }
            }
        });
    }


    CooCoo.cmd.SET = setProcess;
})();
