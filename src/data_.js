// DataBase is a base class for DATA command, not database.
CooCoo.DataBase = CooCoo.Base.extend({
    init: function(parent, load/*, ...*/) {
        var self = this;

        CooCoo.DataBase.__super__.init.call(self, parent);

        self[load ? 'load' : 'save'].apply(self, Array.prototype.slice.call(arguments, 2));
    }
});

CooCoo.Data = {};
