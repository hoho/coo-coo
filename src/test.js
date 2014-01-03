(function() {
    /* global cooMatchCommand */

    function testProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'TEST': {
                '(': function() {
                    // TEST (expr)
                    //     ...
                    cmd.hasSubblock = true;
                }
            }
        });
    }


    CooCoo.cmd.TEST = testProcess;
})();
