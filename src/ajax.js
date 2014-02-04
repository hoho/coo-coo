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


    function getValueGetter(cmd, prop, err) {
        return {
            '@': function() {
                checkForDuplicate(cmd, prop, err);

                cooProcessBlockAsValue(cmd, {
                    getCodeBeforeBefore: function() {
                        return prop + ': ';
                    },

                    getCodeAfterAfter: function() {
                        return cmd.last ? '' : ',';
                    }
                });
            },

            '(': function() {
                checkForDuplicate(cmd, prop, err);

                cmd.getCodeBefore = function() {
                    var ret = [];

                    ret.push(prop);
                    ret.push(': ');
                    ret.push(cooValueToJS(cmd, cmd.parts[1]));

                    if (!cmd.last) {
                        ret.push(',');
                    }

                    return ret.join('');
                };
            }
        };
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
            URL: getValueGetter(cmd, 'url', 'Duplicate URL'),

            GET: function() {
                checkForDuplicate(cmd, 'method', 'Duplicate request method');

                cmd.getCodeBefore = function() {
                    return 'method: "GET"' + (cmd.last ? '' : ',');
                };
            },

            POST: function() {
                checkForDuplicate(cmd, 'method', 'Duplicate request method');

                cmd.getCodeBefore = function() {
                    return 'method: "POST"' + (cmd.last ? '' : ',');
                };
            },

            TYPE: getValueGetter(cmd, 'type', 'Duplicate request type'),

            DATA: getValueGetter(cmd, 'data', 'Duplicate data'),

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
            },

            COMPLETE: {
                '@': function() {
                    checkForDuplicate(cmd, 'complete', 'Duplicate COMPLETE');

                    cooProcessBlockAsFunction(cmd, false, 1, {
                        getCodeBeforeBefore: function() {
                            return 'complete: ';
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
