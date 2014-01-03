(function() {
    /* global cooMatchCommand */

    function chooseProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'CHOOSE': function() {
                // CHOOSE
                //     ...
                cmd.hasSubblock = true;
                cmd.processChild = chooseProcessChoices;
            }
        });
    }


    function chooseProcessChoices(cmd) {
        return cooMatchCommand(cmd, {
            'WHEN': {
                '(': function() {
                    // WHEN (expr)
                    //     ...
                    if (cmd.parent.hadOtherwise) {
                        return cmd.parts[0];
                    }

                    cmd.hasSubblock = true;
                    cmd.valueRequired = cmd.parent.parent.valueRequired;
                }
            },

            'OTHERWISE': function() {
                // OTHERWISE
                //     ...
                if (cmd.parent.hadOtherwise) {
                    return cmd.parts[0];
                }

                cmd.parent.hadOtherwise = true;

                cmd.hasSubblock = true;
                cmd.valueRequired = cmd.parent.parent.valueRequired;
            }
        });
    }


    CooCoo.cmd.CHOOSE = chooseProcess;
})();
