CooCoo.each = function(what, callback, context) {
    var i;

    if (what instanceof Array) {
        for (i = 0; i < what.length; i++) {
            callback.call(context, what[i], i);
        }
    } else {
        for (i in what) {
            callback.call(context, what[i], i);
        }
    }
};
