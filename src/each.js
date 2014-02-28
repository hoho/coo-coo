(function() {
    /* global cooMatchCommand */
    /* global cooValueToJS */
    /* global cooAssertNotValuePusher */
    /* global cooCreateScope */
    /* global cooPushScopeVariable */

    function eachProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }


        function getEachHandler(withKey) {
            return function eachHandler() {
                // each val (expr)
                //     ...
                // each key val (expr)
                //     ...
                cooAssertNotValuePusher(cmd);
                cmd.hasSubblock = true;

                cooCreateScope(cmd);

                cmd.getCodeBefore = function() {
                    var ret = [];

                    cooPushScopeVariable(cmd, cmd.parts[1].value, false);
                    if (withKey) { cooPushScopeVariable(cmd, cmd.parts[2].value, false); }

                    ret.push('CooCoo.each(');
                    ret.push(cooValueToJS(cmd, cmd.parts[withKey ? 3 : 2]));
                    ret.push(', function(');
                    if (withKey) {
                        ret.push(cmd.parts[2].value);
                        ret.push(', ');
                    }
                    ret.push(cmd.parts[1].value);
                    ret.push(') {');

                    return ret.join('');
                };

                cmd.getCodeAfter = function() {
                    return '}, this);';
                };

            };
        }


        return cooMatchCommand(cmd, {
            'each': {
                '': {
                    '(': getEachHandler(false),
                    '': {
                        '(': getEachHandler(true)
                    }
                }
            }
        });
    }


    CooCoo.cmd.each = {
        process: eachProcess,
        arrange: null,
        base: 'each'
    };
})();
