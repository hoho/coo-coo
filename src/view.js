(function() {
    /* global cooModelViewCollectionBase */
    /* global cooExtractParamNames */
    /* global cooExtractParamValues */

    cooModelViewCollectionBase('VIEW', {
        RENDER: {
            '*': function(cmd) {
                // RENDER identifier identifier2 ...
                var part = cmd.parts[0];

                if (cmd.parent.data.render) {
                    part.error = 'Duplicate renderer';
                    return part;
                } else {
                    cmd.parent.data.render = true;
                }

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

                            var params = cooExtractParamValues(cmd.parts, 4);
                            if (params.error) { return params.error; } else { params = params.values; }

                            cmd.hasSubblock = true;
                        }
                    }
                }
            }
        }
    });
})();
