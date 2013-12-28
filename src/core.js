/*!
 * coo-coo v0.0.0, https://github.com/hoho/coo-coo
 * (c) 2013 Marat Abdullin, MIT license
 */
var fs = require('fs'),
    util = require('./util.js');


var INDENT_WITH = ' ',
    INDENT = INDENT_WITH + INDENT_WITH + INDENT_WITH + INDENT_WITH,

    COO_COMMAND_PART_STRING = 'string',
    COO_COMMAND_PART_JS = 'javascript',
    COO_COMMAND_PART_IDENTIFIER = 'identifier';


function CooCommand() {

}

CooCommand.prototype = {
    _setget: function(name, val) {
        if (val === undefined) { return this[name]; }
        else { this[name] = val; }
    },

    valuePusher: function(val) { return this._setget('_valuePusher', val); },
    valueRequired: function(val) { return this._setget('_valueRequired', val); },
    hasSubblock: function(val) { return this._setget('_hasSubblock', val); },
    parts: function(val) { return this._setget('_parts', val); }
};


function CooCommandPart(type, lineAt, charAt) {
    this._type = type;
    this._lineAt = lineAt;
    this._charAt = charAt;
}

CooCommandPart.prototype = {
    type: function() { return this._type; },
    value: function(val) { return CooCommand.prototype._setget.call(this, val); }
};


function CooFile(filename) {
    var data = fs.readFileSync(filename, {encoding: 'utf8'});

    this.filename = filename;
    this.src = data.split(/\n\r|\r\n|\r|\n/);
    this.code = data.split(/\n\r|\r\n|\r|\n/);

    util.cooClearComments(this.code);
}

CooFile.prototype = {
    read: function(ret) {
        var oldRet = this.ret,
            oldLineAt = this.lineAt,
            oldCharAt = this.charAt,
            oldBlockIndent = this.blockIndent;

        this.ret = ret;
        this.lineAt = this.charAt = 0;
        this.blockIndent = 0;

        while (this.skipEmptyLines()) {
            this.readCommand();
        }

        this.ret = oldRet;
        this.lineAt = oldLineAt;
        this.charAt = oldCharAt;
        this.blockIndent = oldBlockIndent;
    },

    skipEmptyLines: function() {
        for (var i = this.lineAt; i < this.code.length; i++) {
            if (this.code[i] !== '') {
                break;
            }
        }

        this.lineAt = i;
        this.charAt = 0;

        return this.lineAt < this.code.length;
    },

    readCommand: function(parent) {
        var i,
            line = this.code[this.lineAt],
            cmd = new CooCommand();

        for (i = 0; i < this.blockIndent; i++) {
            if (line[i] !== INDENT_WITH) {
                this.errorBadIndentation(i);
            }
        }

        i = this.blockIndent;

        if (line[i] === '+') {
            if (!parent || !parent.valueRequired()) {
                // Pretty dumb error messages.
                this.error(
                    parent ?
                        '"' + parent.name + '" command does not require return value.'
                        :
                        'No place to return value to.',
                    i
                );
            } else {
                // This command pushes value to parent one.
                cmd.valuePusher(true);
                i++;
            }
        }

        if (line[i].match(/[a-zA-Z"'(_]/)) {
            var parts = this.readCommandParts(i);

            cmd.parts(parts);

            if (parts[0].type() === COO_COMMAND_PART_STRING ||
                parts[0].type() === COO_COMMAND_PART_JS)
            {
                // Check for certain conditions in case command begins with
                // a string or with a JavaScript expression.
                if (parent && parent.valueRequired() && cmd.valuePusher()) {
                    // TODO: Implement.

                    if (parts.length > 1) { this.errorUnexpectedPart(parts[1]); }

                    this.lineAt++;
                    this.charAt = 0;
                } else {
                    this.errorUnexpectedPart(parts[0]);
                }
            } else {
                // Match command and run it's callback.
                // TODO: Implement.

                if (cmd.hasSubblock()||1) {
                    this.readBlock(cmd);
                } else {
                    this.lineAt++;
                    this.charAt = 0;
                }
            }
        } else {
            if (line[i] === INDENT_WITH) { this.errorBadIndentation(i); }
            else { this.errorUnexpectedSymbol(i); }
        }
    },

    readCommandParts: function(charAt) {
        var parts = [];

        this.charAt = charAt;

        while (this.charAt < this.code[this.lineAt].length) {
            switch (this.code[this.lineAt][this.charAt]) {
                case '"':
                /* jshint -W109 */
                case "'":
                /* jshint +W109 */
                    parts.push(this.readString());
                    break;

                case '(':
                    parts.push(this.readJS(0));
                    break;

                default:
                    parts.push(this.readIdentifier());
            }
        }

        return parts;
    },

    readString: function() {
        var part = new CooCommandPart(COO_COMMAND_PART_STRING, this.lineAt, this.charAt);

        this.charAt++;

        return part;
    },

    readJS: function(indent) {
        var part = new CooCommandPart(COO_COMMAND_PART_JS, this.lineAt, this.charAt),
            val = [];

        if (!indent) {
            this.charAt++;
        }

        part.value(val);

        return part;
    },

    readIdentifier: function() {
        var part = new CooCommandPart(COO_COMMAND_PART_IDENTIFIER, this.lineAt, this.charAt);

        this.charAt++;

        return part;
    },

    readBlock: function(parent) {
        this.lineAt++;
        this.charAt = 0;

        if (!this.skipEmptyLines()) { return false; }

        var oldIndent = this.blockIndent,
            indent,
            curIndent;

        indent = 0;
        while (this.code[this.lineAt][indent] === INDENT_WITH) { indent++; }

        if (indent > oldIndent) {
            this.blockIndent = indent;

            curIndent = indent;

            while (curIndent === indent) {
                this.readCommand(parent);
                this.lineAt++;
                this.charAt = 0;

                curIndent = 0;
                if (this.skipEmptyLines()) {
                    while (this.code[this.lineAt][curIndent] === INDENT_WITH) { curIndent++; }
                }
            }

            this.blockIndent = oldIndent;
        }
    },

    skipWhitespaces: function() {

    },

    error: function(msg, charAt, lineAt) {
        var line = (lineAt === undefined ? this.lineAt : lineAt) + 1,
            col = charAt + 1;

        throw new Error(this.filename + ': ' + msg + ' (line: ' + line + ', col: ' + col + '):\n' +
                        this.src[line - 1] + '\n' + (new Array(col).join(' ')) + '^\n');
    },

    errorBadIndentation: function(charAt) {
        this.error('Bad indentation', charAt);
    },

    errorUnexpectedSymbol: function(charAt) {
        this.error('Unexpected symbol', charAt);
    },

    errorUnexpectedPart: function(part) {
        this.error('Unexpected ' + part.type(), part._charAt, part._lineAt);
    }
};


function cooRunGenerators(gen, code, level) {
    var g = gen.gen,
        i,
        indent = (new Array(level)).join(INDENT);

    if (gen.before) {
        code.push(indent + gen.before());
    }

    if (g) {
        for (i = 0; i < g.length; i++) {
            cooRunGenerators(g[i], code, level + 1);
        }
    }

    if (gen.after) {
        code.push(indent + gen.after());
    }
}


function CooCoo(filenames, commons, project) {
    var ret = {
        common: {core: true},
        postParse: {},
        gen: []
    };

    var i,
        file,
        tmp,
        func,
        code = [];

    for (i = 0; i < filenames.length; i++) {
        file = new CooFile(filenames[i]);
        file.read(ret);
    }

    tmp = ret.postParse;
    for (func in tmp) {
        func();
    }

    tmp = ret.gen;
    for (i = 0; i < tmp.length; i++) {
        cooRunGenerators(tmp[i], code, 0);
    }

    console.log(commons, project, code.join('\n'));
}

CooCoo.cmd = {};

module.exports = CooCoo;
