(function() {
    /* global cooMatchCommand */

    function setProcess(cmd) {
        return cooMatchCommand(cmd.parts, {
            'SET': {
                '': {
                    '@': function() {
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;
                    },

                    '(': function() {},
                    '"': function() {}
                }
            }
        });
    }


    CooCoo.cmd.SET = setProcess;
})();
