(function() {
    /* global cooMatchCommand */
    /* global cooPushScopeVariable */
    /* global cooWrapRet */
    /* global cooValueToJS */
    /* global cooAssertNotValuePusher */
    /* global cooProcessBlockAsValue */
    /* global COO_COMMAND_PART_VARIABLE */
    /* global COO_COMMAND_PART_PROPERTY */
    /* global cooAssertHasSubcommands */
    /* global cooCheckProperty */
    /* global cooWrapWithTypeCheck */

    function setFromBody(cmd) {
        // set identifier
        //     ...
        cooAssertNotValuePusher(cmd);

        if (cmd.parts[1].type === COO_COMMAND_PART_VARIABLE) {
            cooPushScopeVariable(cmd.parent, cmd.parts[1].value);
        }

        var exts;

        if (cmd.parts[1].type === COO_COMMAND_PART_PROPERTY) {
            exts = {
                getCodeBeforeBefore: function() {
                    cooAssertHasSubcommands(cmd);

                    var type = cooCheckProperty(cmd, cmd.root, cmd.parts[1]),
                        ret = [],
                        wrapper;

                    ret.push('this.set("');
                    ret.push(cmd.parts[1].value);
                    ret.push('", ');


                    wrapper = cooWrapWithTypeCheck(
                        cmd,
                        cmd.children[0].parts[0],
                        type
                    );

                    if (wrapper) {
                        ret.push(wrapper[0]);
                        cmd.wrapperEnd = wrapper[1];
                    }

                    return ret.join('');
                },

                getCodeAfterAfter: function() {
                    var ret = [];

                    if (cmd.wrapperEnd) { ret.push(cmd.wrapperEnd); }

                    if (cmd.parts[0].value === 'reset') {
                        ret.push(', true');
                    }

                    ret.push(');');

                    return ret.join('');
                }
            };
        } else {
            exts = {
                getCodeBeforeBefore: function() {
                    var ret = [];
                    ret.push(cmd.parts[1].value);
                    ret.push(' = CooCoo.');
                    if (cmd.parts[0].value === 'reset') {
                        ret.push('reset');
                    } else {
                        ret.push('u');
                    }
                    ret.push('(');
                    return ret.join('');
                },

                getCodeAfterAfter: function() {
                    var ret = [];
                    if (cmd.parts[0].value === 'reset') {
                        ret.push(', ');
                        ret.push(cmd.parts[1].value);
                    }
                    ret.push(');');
                    return ret.join('');
                }
            };
        }

        return cooProcessBlockAsValue(cmd, exts);
    }


    function setFromExpr(cmd) {
        // set identifier (expr)
        var name = cmd.parts[1].value,
            val = cmd.parts[2];

        cooAssertNotValuePusher(cmd);

        if (cmd.parts[1].type === COO_COMMAND_PART_VARIABLE) {
            cooPushScopeVariable(cmd.parent, name);
        }

        cmd.getCodeBefore = function() {
            var ret = [],
                retWrap = cooWrapRet(cmd);

            ret.push(retWrap[0]);

            if (cmd.parts[1].type === COO_COMMAND_PART_PROPERTY) {
                var type = cooCheckProperty(cmd, cmd.root, cmd.parts[1]);

                ret.push('this.set("');
                ret.push(cmd.parts[1].value);
                ret.push('", ');

                ret.push(cooWrapWithTypeCheck(
                    cmd,
                    cmd.parts[2],
                    type,
                    cooValueToJS(cmd, cmd.parts[2])
                ));

                if (cmd.parts[0].value === 'reset') {
                    ret.push(', true');
                }

                ret.push(')');
            } else {
                ret.push(name);
                ret.push(' = CooCoo.');
                if (cmd.parts[0].value === 'reset') {
                    ret.push('reset');
                } else {
                    ret.push('u');
                }
                ret.push('(');
                ret.push(cooValueToJS(cmd, val));
                if (cmd.parts[0].value === 'reset') {
                    ret.push(', ');
                    ret.push(name);
                }
                ret.push(')');
            }

            ret.push(retWrap[1]);

            return ret.join('');
        };
    }


    function setProcess(cmd) {
        if (!cmd.parent) {
            return cmd.parts[0];
        }

        return cooMatchCommand(cmd, {
            'set': {
                '($)': {
                    '@': setFromBody,
                    '(<': setFromExpr
                },

                '(@)': {
                    '@': setFromBody,
                    '(<': setFromExpr
                }
            },

            'reset': {
                '($)': {
                    '@': setFromBody,
                    '(<': setFromExpr
                },

                '(@)': {
                    '@': setFromBody,
                    '(<': setFromExpr
                }
            }
        });
    }


    CooCoo.cmd.set = CooCoo.cmd.reset = {
        process: setProcess,
        arrange: null
    };
})();
