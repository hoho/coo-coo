(function() {
    function domProcess(cmd) {
        if (cmd.parent) {
        } else {
            // Template declaration.
            cmd.hasSubblock(true);
        }
    }


    CooCoo.cmd.DOM = domProcess;
})();
