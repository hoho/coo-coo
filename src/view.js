(function() {
    /* global cooModelViewCollectionBase */
    /* global cooExtractParamNames */

    cooModelViewCollectionBase('VIEW', {
        RENDER: {
            '*': function(cmd) {
                // RENDER identifier identifier2 ...
                cmd.hasSubblock = true;
                cmd.valueRequired = true;

                var params = cooExtractParamNames(cmd.parts, 1);
                if (params.error) { return params.error; } else { params = params.params; }
            }
        }
    }, {
        'VIEW': {
            '': {
                '(': {
                    'RENDER': {
                        '@': function(cmd) {
                            // VIEW identifier (expr) RENDER
                            cmd.hasSubblock = true;
                        },

                        '#': function(cmd) {
                            // VIEW identifier (expr) RENDER (expr2) (expr3) ...
                            cmd.hasSubblock = true;
                        }
                    }
                }
            }
        }
    });
})();
