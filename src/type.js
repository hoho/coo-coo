/* global COO_COMMAND_PART_IDENTIFIER */
/* global COO_COMMAND_PART_JS */
/* global cooValueToJS */

CooCoo.cmd.String = {
    process: function(cmd) { return cmd.parts[0]; },
    type: {
        validate: function(file, part) {
            if (part.value.length > 1) {
                file.errorUnexpectedPart(part.value[1]);
            }
        },
        getAssertExpression: function(cmd, part, val) {
            return 'typeof ' + val + ' === "string"';
        }
    }
};


CooCoo.cmd.Number = {
    process: function(cmd) { return cmd.parts[0]; },
    type: {
        validate: function(file, part) {
            if (part.value.length > 1) {
                file.errorUnexpectedPart(part.value[1]);
            }
        },
        getAssertExpression: function(cmd, part, val) {
            return 'typeof ' + val + ' === "number"';
        }
    }
};


CooCoo.cmd.js = {
    // js command is processed from core.js, only typification part is here.
    type: {
        validate: function(file, part) {
            if (part.value.length < 3) {
                part.value[0].error = 'Incomplete typification';
                file.errorUnexpectedPart(part.value[0]);
            }

            if (part.value[1].type !== COO_COMMAND_PART_IDENTIFIER) {
                file.errorUnexpectedPart(part.value[1]);
            }

            if (part.value[2].type !== COO_COMMAND_PART_JS) {
                file.errorUnexpectedPart(part.value[2]);
            }

            if (part.value.length > 3) {
                file.errorUnexpectedPart(part.value[3]);
            }
        },
        getAssertExpression: function(cmd, part, val) {
            var ret = [];

            ret.push('(function(');
            ret.push(part.value[1].value);
            ret.push(') { return ');
            ret.push(cooValueToJS(cmd, part.value[2]));
            ret.push('; })(');
            ret.push(val);
            ret.push(')');

            return ret.join('');
        }
    }
};
