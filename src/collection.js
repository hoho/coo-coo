(function() {
    /* global cooMatchCommand */

    function collectionProcess(cmd) {
        if (cmd.parent) {
            return collectionProcessCommand(cmd);
        } else {
            // Collection declaration.
            cmd.hasSubblock = true;
        }
    }


    function collectionProcessCommand(cmd) {
        return cooMatchCommand(cmd.parts, {
            'COLLECTION': {
                '': {
                    'CREATE': {
                        '#': function() {
                            cmd.hasSubblock = true;
                            cmd.processChild = collectionProcessParamsAndEvents;
                        }
                    }
                }
            }
        });
    }


    function collectionProcessParamsAndEvents(cmd) {
        return cooMatchCommand(cmd.parts, {
            PARAM: {
                '': {
                    '@': function() {
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;
                    },

                    '(': function() {
                    },

                    '"': function() {
                    }
                }
            },

            ON: {
                '': {
                    '@': function() {
                        cmd.hasSubblock = true;
                    },

                    '*': function() {
                        cmd.hasSubblock = true;
                    }
                }
            }
        });
    }


    CooCoo.cmd.COLLECTION = collectionProcess;
})();
