(function() {
    /* global cooMatchCommand */

    function domProcess(cmd) {
        return cooMatchCommand(cmd, {
            'DOM': {
                '(': {
                    'APPEND': {
                        '@': function() {
                            cmd.hasSubblock = true;
                            cmd.valueRequired = true;
                        },

                        '(': function() {

                        }
                    }
                }
            }
        });
    }


    CooCoo.cmd.DOM = domProcess;
})();
