module.exports = function() {
    test();
};


var assert = require('assert'),
    CooCoo = require('../lib/coocoo.js');


function test() {
    try {
        var coocoo = CooCoo(
            //['examples/todo/src/todo.coo', 'examples/todo/src/todoItem.coo'],
            ['examples/simple/src/list.coo'],
            './test/test-common.js',
            './test/test-app.js',
            true
        );

    } catch(e) {
        console.log(e.stack);
    }
}
