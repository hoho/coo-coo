(function() {
    /* global cooObjectBase */
    /* global cooProcessCreateCommand */

    cooObjectBase(
        {
            cmdName: 'DATA',
            cmdStorage: 'CooCoo.Data',
            baseClass: {name: 'CooCoo.DataBase'},
            triggers: {
                SUCCESS: {actualName: 'success'},
                ERROR: {actualName: 'error'}
            }
        },
        {
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
                    LOAD: {
                        '#': function(cmd) {
                            // DATA identifier LOAD (expr) ...
                            //     ...
                            return cooProcessCreateCommand(
                                cmd,
                                3,
                                undefined,
                                {
                                    SUCCESS: {
                                        hasName: false,
                                        hasParams: true
                                    },

                                    ERROR: {
                                        hasName: false,
                                        hasParams: false
                                    }
                                },
                                'load',
                                function(values) {
                                    return 'true' + (values ? ', ' + values : '');
                                }
                            );
                        }
                    },

                    SAVE: {
                        '#': function(cmd) {
                            // DATA identifier SAVE (expr) ...
                            //     ...
                            return cooProcessCreateCommand(
                                cmd,
                                3,
                                undefined,
                                {
                                    SUCCESS: {
                                        hasName: false,
                                        firstParam: 1
                                    },

                                    ERROR: {
                                        hasName: false,
                                        firstParam: false
                                    }
                                },
                                'save',
                                function(values) {
                                    return 'false' + (values ? ', ' + values : '');
                                }
                            );
                        }
                    }
                }
            }
        }
    );
})();
