(function() {
    /* global cooMatchCommand */

    function testProcess(cmd) {
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
