CooCoo.Model = {};

CooCoo.ModelBase = CooCoo.Base.extend({
    activate: function(name, val, keepPrevious) {
        var key;

        for (key in this.__e) {
            // Run only in case we have propagation parents.
            this.trigger('activate:' + name, !!val, name, !!keepPrevious);
            break;
        }
    }
});
