(function() {
    /* global cooModelViewCollectionBase */
    /* global cooMatchCommand */

    cooModelViewCollectionBase('COLLECTION', {
        MODEL: {
            '': function() {},
            '"': function() {},
            '(': function() {}
        }
    }, {
    }, {
        decl: {

        },

        cmd: {
            construct: function(cmd, params) {
                this.before = null;
                this.after = null;

                console.log(params);
            },

            create: function(cmd, params) {
                console.log(params);
                cmd.processChild = collectionProcessParamsAndEvents;
            }
        }
    });


    function collectionProcessParamsAndEvents(cmd) {
        return cooMatchCommand(cmd.parts, {
            PARAM: {
                '': {
                    '@': function() {
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;
                    },

                    '(': function() {
                    },

                    '"': function() {
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
})();
