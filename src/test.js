(function() {
    /* global cooMatchCommand */
    /* global cooValueToJS */

    function testProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'TEST': {
                '(': function() {
                    // TEST (expr)
                    //     ...
                    cmd.hasSubblock = true;
                    cmd.valueRequired = cmd.parent.valueRequired;
                    cmd.noScope = true;

                    cmd.getCodeBefore = function() {
                        var ret = [];

                        ret.push('if (');
                        ret.push(cooValueToJS(cmd, cmd.parts[1]));
                        ret.push(') {');

                        return ret.join('');
                    };

                    cmd.getCodeAfter = function() {
                        return '}';
                    };
                }
            }
        });
    }


    CooCoo.cmd.TEST = {
        process: testProcess,
        arrange: null
    };
})();
