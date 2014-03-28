(function() {
    /* global cooMatchCommand */
    /* global cooValueToJS */
    /* global cooAssertNotRetPusher */

    function chooseProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'choose': function() {
                // choose
                //     ...
                cooAssertNotRetPusher(cmd);
                cmd.hasSubblock = true;
                cmd.processChild = chooseProcessChoices;
                cmd.indent = 0;
            }
        });
    }


    function chooseProcessChoices(cmd) {
        return cooMatchCommand(cmd, {
            'when': {
                '(': function() {
                    // when (expr)
                    //     ...
                    cooAssertNotRetPusher(cmd);

                    if (cmd.parent.hasOtherwise) {
                        return cmd.parts[0];
                    }

                    cmd.hasSubblock = true;
                    cmd.noScope = true;

                    cmd.getCodeBefore = function() {
                        var ret = [];

                        if (!cmd.first) {
                            ret.push('} else ');
                        }

                        ret.push('if (');
                        ret.push(cooValueToJS(cmd, cmd.parts[1]));
                        ret.push(') {');

                        return ret.join('');
                    };

                    cmd.getCodeAfter = function() {
                        if (cmd.last) {
                            return '}';
                        }
                    };
                }
            },

            'otherwise': function() {
                // otherwise
                //     ...
                cooAssertNotRetPusher(cmd);

                if (cmd.parent.hasOtherwise) {
                    return cmd.parts[0];
                }

                cmd.parent.hasOtherwise = true;

                cmd.hasSubblock = true;
                cmd.noScope = true;

                cmd.getCodeBefore = function() {
                    if (cmd.first) {
                        cmd.indent = 0;
                    } else {
                        return '} else {';
                    }
                };

                cmd.getCodeAfter = function() {
                    if (!cmd.first && cmd.last) {
                        return '}';
                    }
                };
            }
        });
    }


    CooCoo.cmd.choose = {
        process: chooseProcess,
        arrange: null
    };
})();
