(function() {
    function collectionProcess(cmd) {
        if (cmd.parent) {

        } else {
            // Collection declaration.
            cmd.hasSubblock = true;
        }
    }


    CooCoo.cmd.COLLECTION = collectionProcess;
})();
