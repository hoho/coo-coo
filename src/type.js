CooCoo.cmd.STRING = {
    process: function(cmd) { return cmd.parts[0]; },
    type: {
        validate: function(file, part) {
            if (part.value.length > 1) {
                file.errorUnexpectedPart(part.value[1]);
            }
        },
        getAssertExpression: function(cmd, part, val) {
            return 'typeof CooCooRet(' + val + ').valueOf() === "string"';
        }
    }
};
