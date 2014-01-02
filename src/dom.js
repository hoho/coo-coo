(function() {
    /* global cooMatchCommand */

    function domProcess(cmd) {
        return cooMatchCommand(cmd, {
            'DOM': {
                '(': {
                    '@': function() {
                        // DOM (expr)
                        cmd.hasSubblock = true;
                        cmd.valueRequired = false;

                        cmd.processChild = domProcessEvents;
                    },

                    'APPEND': {
                        '@': function() {
                            // DOM (expr) APPEND
                            //     ...
                            cmd.hasSubblock = true;
                            cmd.valueRequired = true;
                        },

                        '(': function() {
                            // DOM (expr) APPEND (expr2)
                        }
                    },

                    'CLASS': {
                        'ADD': {
                            '"': function() {
                                // DOM (expr) CLASS ADD "text"

                            },

                            '(': function() {
                                // DOM (expr) CLASS ADD (expr2)
                            }
                        },

                        'REMOVE': {
                            '"': function() {
                                // DOM (expr) CLASS REMOVE "text"

                            },

                            '(': function() {
                                // DOM (expr) CLASS REMOVE (expr2)
                            }
                        }
                    },

                    'TRIGGER': {
                        '': {
                            '@': function() {
                                // DOM (expr) TRIGGER identifier
                                //     ...
                            },

                            '#': function() {
                                // DOM (expr) TRIGGER identifier (expr) (expr2) ...
                            }
                        }
                    },

                    'VALUE': {
                        'SET': {
                            '@': function() {
                                // DOM (expr) VALUE SET
                                //     ...
                            },

                            '(': function() {
                                // DOM (expr) VALUE SET (expr2)
                            },

                            '"': function() {
                                // DOM (expr) VALUE SET "text"
                            }
                        },

                        'GET': function() {
                            // DOM (expr) VALUE GET
                        }
                    }
                }
            }
        });
    }


    function domProcessEvents(cmd) {
        return cooMatchCommand(cmd, {
            'ON': {
                '': {
                    '*': function() {
                        // ON identifier identifier2 ...
                        cmd.hasSubblock = true;
                    }
                }
            }
        });
    }


    CooCoo.cmd.DOM = domProcess;
})();
