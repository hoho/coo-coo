module.exports = function() {
    test();
};


var assert = require('assert'),
    CooCoo = require('../dist/coo-coo.js');


function test() {
    var coocoo = CooCoo(
        ['examples/todo/src/todo.coo', 'examples/todo/src/todoItem.coo'],
        './test/test-common.js',
        './test/test-gen.js'
    );


}
