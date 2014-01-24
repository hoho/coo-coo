(function() {
    /* global cooObjectBase */
    /* global cooProcessCreateCommand */
    /* global cooProcessInstance */
    /* global cooGetProcessParamsAndEvents */

    var dataEvents = {
        LOADED: {
            hasName: false,
            hasParams: true
        },

        LOAD_ERROR: {
            hasName: false,
            hasParams: false
        },

        SAVED: {
            hasName: false,
            hasParams: true
        },

        SAVE_ERROR: {
            hasName: false,
            hasParams: false
        }
    };

    cooObjectBase(
        {
            cmdName: 'DATA',
            cmdStorage: 'CooCoo.Data',
            baseClass: {name: 'CooCoo.DataBase'},
            triggers: {
                LOADED: {actualName: 'loaded'},
                LOAD_ERROR: {actualName: 'loadError'},
                SAVEED: {actualName: 'saved'},
                SAVE_ERROR: {actualName: 'saveError'}
            }
        },
        {
            init: true,
            properties: true,
            specialMethods: {
                LOAD: {
                    actualName: 'load'
                },

                SAVE: {
                    actualName: 'save'
                }
            }
        },
        {
            DATA: {
                '': {
                    CREATE: {
                        '#': function(cmd) {
                            // DATA identifier CREATE (expr) ...
                            //     ...
                            return cooProcessCreateCommand(
                                cmd,
                                3,
                                undefined,
                                dataEvents,
                                'load'
                            );
                        }
                    },

                    '(': {
                        '@': function(cmd) {
                            // DATA identifier (expr)
                            //     ...
                            cooProcessInstance(
                                cmd,
                                undefined,
                                4,
                                cooGetProcessParamsAndEvents(false, dataEvents)
                            );
                        },

                        LOAD: {
                            '#': function(cmd) {
                                // DATA identifier (expr) LOAD (expr) ...
                                //     ...
                                cooProcessInstance(cmd, 'load', 4);
                            }
                        },

                        SAVE: {
                            '#': function(cmd) {
                                // DATA identifier (expr) SAVE (expr) ...
                                //     ...
                                cooProcessInstance(cmd, 'save', 4);
                            }
                        }
                    }
                }
            }
        }
    );
})();
