(function() {
    /* global cooObjectBase */
    /* global cooProcessCreateCommand */

    cooObjectBase(
        {
            cmdName: 'DATA',
            cmdStorage: 'CooCoo.Data',
            baseClass: {name: 'CooCoo.DataBase'}
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
                                'load'
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
                                'save'
                            );
                        }
                    }
                }
            }
        }
    );
})();
