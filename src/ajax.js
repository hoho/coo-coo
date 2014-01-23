(function() {
    /* global cooProcessBlockAsValue */
    /* global cooValueToJS */
    /* global cooMatchCommand */
    /* global cooProcessBlockAsFunction */

    function checkForDuplicate(cmd, what, err) {
        if (cmd.parent.data[what]) {
            cmd.parts[0].error = err;
            cmd.file.errorUnexpectedPart(cmd.parts[0]);
        }
        cmd.parent.data[what] = true;
    }


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
                    checkForDuplicate(cmd, 'url', 'Duplicate URL');

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
                    checkForDuplicate(cmd, 'url', 'Duplicate URL');

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
                '*': function(cmd) {
                    checkForDuplicate(cmd, 'success', 'Duplicate SUCCESS');

                    if (cmd.parts.length > 2) {
                        cmd.parts[2].error = 'Too many parameters';
                        cmd.file.errorUnexpectedPart(cmd.parts[2]);
                    }

                    cooProcessBlockAsFunction(cmd, false, 1, {
                        getCodeBeforeBefore: function() {
                            return 'success: ';
                        },

                        getCodeAfterAfter: function() {
                            if (!cmd.last) {
                                return ',';
                            }
                        }
                    });
                }
            },

            ERROR: {
                '@': function() {
                    checkForDuplicate(cmd, 'error', 'Duplicate ERROR');

                    cooProcessBlockAsFunction(cmd, false, 1, {
                        getCodeBeforeBefore: function() {
                            return 'error: ';
                        },

                        getCodeAfterAfter: function() {
                            if (!cmd.last) {
                                return ',';
                            }
                        }
                    });
                }
            }
        });
    }


    CooCoo.cmd.AJAX = {
        process: ajaxProcess,
        arrange: null,
        base: 'ajax'
    };
})();
