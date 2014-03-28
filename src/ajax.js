(function() {
    /* global cooProcessBlockAsValue */
    /* global cooValueToJS */
    /* global cooMatchCommand */
    /* global cooProcessBlockAsFunction */
    /* global cooAssertNotRetPusher */

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
                'ajax': function() {
                    cooAssertNotRetPusher(cmd);

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
            'url': getValueGetter(cmd, 'url', 'Duplicate url'),

            'get': function() {
                checkForDuplicate(cmd, 'method', 'Duplicate request method');

                cmd.getCodeBefore = function() {
                    return 'method: "GET"' + (cmd.last ? '' : ',');
                };
            },

            'post': function() {
                checkForDuplicate(cmd, 'method', 'Duplicate request method');

                cmd.getCodeBefore = function() {
                    return 'method: "POST"' + (cmd.last ? '' : ',');
                };
            },

            'type': getValueGetter(cmd, 'type', 'Duplicate request type'),

            'data': getValueGetter(cmd, 'data', 'Duplicate data'),

            'success': {
                '*': function(cmd) {
                    checkForDuplicate(cmd, 'success', 'Duplicate success');

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

            'error': {
                '@': function() {
                    checkForDuplicate(cmd, 'error', 'Duplicate error');

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

            'complete': {
                '@': function() {
                    checkForDuplicate(cmd, 'complete', 'Duplicate complete');

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


    CooCoo.cmd.ajax = {
        process: ajaxProcess,
        arrange: null,
        base: 'ajax'
    };
})();
