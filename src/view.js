(function() {
    /* global cooModelViewCollectionBase */
    /* global cooExtractParamNames */

    cooModelViewCollectionBase('VIEW', {
        RENDER: {
            '*': function() {
                var params = cooExtractParamNames(this.parts, 1);
                if (params.error) { return params.error; } else { params = params.params; }

                console.log('rerere');
            }
        }
    }, {
        'VIEW': {
            '(': {
                'RENDER': {
                    '#': function() {
                        this.hasSubblock = true;
                    }
                }
            }
        }
    }, {
        decl: {

        },

        cmd: {
            construct: function(params) {
                this.before = null;
                this.after = null;

                console.log(params);
            }
        }
    });
})();
