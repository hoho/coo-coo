(function() {
    /* global cooObjectBase */

    cooObjectBase(
        'COLLECTION',
        'CooCoo.Collection',
        {name: 'CooCoo.CollectionBase'},
        {
            specialProperties: {
                MODEL: {
                    actualName: 'model',
                    required: true,
                    allowIdentifier: true,
                    allowExpression: false,

                    getCodeBefore: function(cmd) {
                        return 'model: CooCoo.Model.' + cmd.parts[1].value;
                    }
                }
            }
        },
        {
        }
    );
})();
