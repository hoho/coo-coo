(function() {
    /* global cooModelViewCollectionBase */

    cooModelViewCollectionBase('MODEL', {}, {}, {
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
