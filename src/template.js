(function() {
    function templateProcess(cmd) {


        if (cmd.parent) {
            cmd.processChild = templateProcessParamsAndEvents;
        } else {
            // Template declaration.
            cmd.processChild = templateProcessDecl;

            cmd.template = {
                type: null,
                name: null,
                params: {}
            };
        }

        cmd.hasSubblock = true;
    }


    function templateProcessDecl(cmd) {
        /* global cooMatchCommand */
        return cooMatchCommand(cmd, {
            'TYPE': {
                '(': function() {
                    // TYPE "text"
                    var type = cmd.parts[1];

                    if (cmd.parent.template.type !== null) {
                        type.error = 'Duplicate type';
                        return type;
                    }

                    cmd.parent.template.type = type.value;
                }
            },

            'NAME': {
                '(': function() {
                    // NAME "text"
                    var name = cmd.parts[1];

                    if (cmd.parent.template.name !== null) {
                        name.error = 'Duplicate name';
                        return name;
                    }

                    cmd.parent.template.name = name.value;
                }
            },

            'PARAM': {
                '': {
                    '@': function() {},
                    '(': function() {}
                }
            }
        });
    }


    function templateProcessParamsAndEvents(cmd) {
        return cooMatchCommand(cmd, {
            PARAM: {
                '': {
                    '@': function() {
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;
                    },

                    '(': function() {
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


    CooCoo.cmd.TEMPLATE = {
        process: templateProcess,
        arrange: null,
        base: 'template'
    };
})();
