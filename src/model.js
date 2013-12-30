(function() {
    function modelProcess(cmd) {
        if (cmd.parent) {
        } else {
            // Template declaration.
            cmd.hasSubblock = true;
        }
    }


    CooCoo.cmd.MODEL = modelProcess;
})();
