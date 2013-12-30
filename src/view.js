(function() {
    function viewProcess(cmd) {
        if (cmd.parent) {
        } else {
            // Template declaration.
            cmd.hasSubblock = true;
            cmd.processChild = viewProcessChild;
        }
    }


    function viewProcessChild(cmd) {
        switch (cmd.name) {
            case 'CONSTRUCT':
                break;

            case 'DESTRUCT':
                break;

            case 'RENDER':
                break;

            case 'PROPERTY':
                break;

            case 'METHOD':
                break;

            default:
                return cmd.parts[0];
        }

        cmd.hasSubblock = true;
        cmd.valueRequired = true;

        console.log(cmd);
    }


    CooCoo.cmd.VIEW = viewProcess;
})();
