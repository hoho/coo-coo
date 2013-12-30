(function() {
    function templateProcess(cmd) {
        if (cmd.parent) {
            cmd.processChild = templateProcessEvent;
        } else {
            // Template declaration.
            cmd.processChild = templateProcessDecl;
            cmd.data = {type: null, name: null};
        }

        cmd.hasSubblock = true;
    }


    function templateProcessDecl(cmd) {
        switch (cmd.name) {
            case 'TYPE':
                if (cmd.parent.data.type !== null) { return cmd.parts[0]; }
                break;

            case 'NAME':
                if (cmd.parent.data.name !== null) { return cmd.parts[0]; }
                break;

            default:
                return cmd.parts[0];
        }

        /* global cooMatchCommand */
        var error = cooMatchCommand(cmd.parts, {
            'TYPE': {'"': function() { console.log(1010); }},
            'NAME': {'"': function() {}}
        });

        return error;
    }


    function templateProcessEvent(cmd) {
        console.log(cmd);
    }


    CooCoo.cmd.TEMPLATE = templateProcess;
})();
