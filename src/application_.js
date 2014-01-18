/* global $H */

CooCoo.AppBase = CooCoo.Base.extend({
    init: function() {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift(null);
        CooCoo.AppBase.__super__.init.apply(this, args);
        $H.run();
    }
});
