(function() {
    /* global cooMatchCommand */
    /* global cooExtractParamNames */

    function viewProcess(cmd) {
        if (cmd.parent) {
        } else {
            // Template declaration.
            cmd.hasSubblock = true;
            cmd.processChild = viewProcessDecl;

            cmd.view = {
                properties: {},
                methods: {},
                construct: null,
                destruct: null,
                render: null
            };
        }
    }


    function viewProcessDecl(cmd) {
        cmd.hasSubblock = true;
        cmd.valueRequired = true;

        return cooMatchCommand(cmd.parts, {
            CONSTRUCT: {
                '*': function() {
                    if (cmd.parent.view.construct) {
                        cmd.parts[0].error = 'Duplicate constructor';
                        return cmd.parts[0];
                    }

                    var params = cooExtractParamNames(cmd.parts, 1);
                    if (params.error) { return params.error; } else { params = params.params; }

                    cmd.parent.view.construct = true;
                    cmd.before = null;
                    cmd.after = null;

                    cmd.valueRequired = false;
                }
            },

            DESTRUCT: function() {
                cmd.valueRequired = false;
                console.log('dede');
            },

            RENDER: {
                '*': function() {
                    var params = cooExtractParamNames(cmd.parts, 1);
                    if (params.error) { return params.error; } else { params = params.params; }

                    console.log('rerere');
                }
            },

            PROPERTY: {
                '': {
                    '@': function() { console.log('propro1'); },

                    '(': function() {
                        console.log('propro2');
                        cmd.hasSubblock = false;
                    },

                    '"': function() {
                        console.log('propro3');
                        cmd.hasSubblock = false;
                    }
                }
            },

            METHOD: {
                '': {
                    '*': function() {
                        var params = cooExtractParamNames(cmd.parts, 2);
                        if (params.error) { return params.error; } else { params = params.params; }

                        console.log('mmmmm');
                    }
                }
            }
        });
    }


    CooCoo.cmd.VIEW = viewProcess;
})();
