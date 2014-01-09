(function() {
    /* global cooObjectBase */
    /* global cooExtractParamValues */
    /* global INDENT */
    /* global COO_INTERNAL_VARIABLE_RET */

    cooObjectBase(
        'VIEW',
        'CooCoo.View',
        {name: 'CooCoo.ViewBase'},
        {
            init: true,
            properties: true,
            methods: true,
            specialMethods: {
                RENDER: {
                    actualName: 'render',
                    required: true,

                    getCodeAfterBefore: function() {
                        return INDENT + 'CooCoo.ViewBase.render.call(this, ' + COO_INTERNAL_VARIABLE_RET + ');';
                    }
                }
            }
        },
        {
            'VIEW': {
                '': {
                    'CREATE': {
                        '#': {
                            'RENDER': {
                                '#': function() {

                                }
                            }
                        }
                    },

                    '(': {
                        'RENDER': {
                            '@': function(cmd) {
                                // VIEW identifier (expr) RENDER
                                cmd.hasSubblock = true;

                                cmd.getCodeBefore = function() {

                                };
                            },

                            '#': function(cmd) {
                                // VIEW identifier (expr) RENDER (expr2) (expr3) ...

                                var params = cooExtractParamValues(cmd, 4);
                                if (params.error) { return params.error; } else { params = params.values; }

                                cmd.hasSubblock = true;
                            }
                        }
                    }
                }
            }
        }
    );
})();