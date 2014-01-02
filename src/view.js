(function() {
    /* global cooModelViewCollectionBase */
    /* global cooExtractParamNames */

    cooModelViewCollectionBase('VIEW', {
        RENDER: {
            '*': function() {
                // RENDER identifier identifier2 ...
                var params = cooExtractParamNames(this.parts, 1);
                if (params.error) { return params.error; } else { params = params.params; }

                console.log('rerere');
            }
        }
    }, {
        'VIEW': {
            '': {
                '(': {
                    'RENDER': {
                        '#': function() {
                            // VIEW identifier (expr) RENDER (expr2) (expr3) ...
                            this.hasSubblock = true;
                        }
                    }
                }
            }
        }
    });
})();
