(function() {
    /* global cooProcessBlockAsValue */
    /* global cooValueToJS */
    /* global cooMatchCommand */
    function ajaxProcess(cmd) {
        if (cmd.parent) {
            cmd.hasSubblock = true;

            cmd.processChild = ajaxProcessSettings;

            return cooMatchCommand(cmd, {
                'AJAX': function() {
                    if (cmd.valuePusher) {
                        cmd.file.errorNoValue(cmd.parts[0]);
                    }

                    cmd.getCodeBefore = function() {
                        return 'new CooCoo.Ajax(this, {';
                    };

                    cmd.getCodeAfter = function() {
                        return '});';
                    };
                }
            });
        } else {
            return cmd.parts[0];
        }
    }


    function ajaxProcessSettings(cmd) {
        return cooMatchCommand(cmd, {
            URL: {
                '@': function() {
                    if (cmd.parent.data.url) {
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }

                    cmd.parent.data.url = true;

                    cooProcessBlockAsValue(cmd, {
                        getCodeBeforeBefore: function() {
                            return 'url: ';
                        },

                        getCodeAfterAfter: function() {
                            return cmd.last ? '' : ',';
                        }
                    });
                },

                '(': function() {
                    if (cmd.parent.data.url) {
                        cmd.file.errorUnexpectedPart(cmd.parts[0]);
                    }

                    cmd.parent.data.url = true;

                    cmd.getCodeBefore = function() {
                        var ret = [];

                        ret.push('url: ');
                        ret.push(cooValueToJS(cmd, cmd.parts[1]));

                        if (!cmd.last) {
                            ret.push(',');
                        }

                        return ret.join('');
                    };
                }
            },

            SUCCESS: {
                '@': function() {
                    cmd.hasSubblock = true;
                },

                '': function() {
                    cmd.hasSubblock = true;
                }
            },

            ERROR: {
                '@': function() {}
            }
        });
    }


    CooCoo.cmd.AJAX = {
        process: ajaxProcess,
        arrange: null,
        base: 'ajax'
    };
})();
