/*!
 * coo-coo v0.0.0, https://github.com/hoho/coo-coo
 * (c) 2013 Marat Abdullin, MIT license
 */
var fs = require('fs'),
    util = require('./util.js'),
    extend = require('deep-extend');


var INDENT_WITH = ' ',
    INDENT = INDENT_WITH + INDENT_WITH + INDENT_WITH + INDENT_WITH,

    COO_COMMAND_PART_STRING = 'string',
    COO_COMMAND_PART_JS = 'JavaScript',
    COO_COMMAND_PART_IDENTIFIER = 'identifier';


function CooCommand(parent) {
    if (parent) {
        this.root = parent.root || parent;
        this.method = parent.method;
    }

    this.parent = parent;
}

CooCommand.prototype = {
    root: null,
    method: null,
    valuePusher: false,
    valueRequired: false,
    hasSubblock: false,
    parts: null,
    processChild: null,
    data: null
};


function CooCommandPart(type, lineAt, charAt) {
    this.type = type;
    this._lineAt = lineAt;
    this._charAt = charAt;
}

CooCommandPart.prototype = {
    type: null,
    value: null,
    error: null
};


/* exported cooMatchCommand */
function cooMatchCommand(cmd, patterns, pos) {
    var parts = cmd.parts,
        part = parts[(pos = pos || 0)],
        error,
        unexpected = true;

    /*

     `patterns` is an object like:
     {
     something: callback,
     something: {something: callback},
     something: {something: {something: callback}}
     something: ...,
     ...
     }

     Where `something`:
     '' in case of any identifier,
     'Identifier' in case of exact identifier,
     '"' in case of any string,
     '"string"' in case of exact string,
     '(' in case of JavaScript,
     '*' in case of any number of identifiers,
     '#' in case of any number of strings or JavaScripts,
     '@' in case of callback.

     And `callback` is a callback to call when pattern is matched.

     */

    if (part) {
        switch (part.type) {
            case COO_COMMAND_PART_STRING:
                /* jshint -W061 */
                var val = JSON.stringify(eval(part.value));
                /* jshint +W061 */

                if (patterns[val]) {
                    error = cooMatchCommand(cmd, patterns[val], pos + 1);
                    unexpected = false;
                }

                if ((error || unexpected) && patterns['"']) {
                    error = cooMatchCommand(cmd, patterns['"'], pos + 1);
                    unexpected = false;
                }

                if ((error || unexpected) && patterns['#']) {
                    error = cooMatchCommand(cmd, patterns, pos + 1);
                    unexpected = false;
                }

                return unexpected ? part : error;

            case COO_COMMAND_PART_JS:
                if (patterns['(']) {
                    error = cooMatchCommand(cmd, patterns['('], pos + 1);
                    unexpected = false;
                }

                if ((error || unexpected) && patterns['#']) {
                    error = cooMatchCommand(cmd, patterns, pos + 1);
                    unexpected = false;
                }

                return unexpected ? part : error;

            case COO_COMMAND_PART_IDENTIFIER:
                if (patterns[part.value]) {
                    error = cooMatchCommand(cmd, patterns[part.value], pos + 1);
                    unexpected = false;
                }

                if ((error || unexpected) && patterns['']) {
                    error = cooMatchCommand(cmd, patterns[''], pos + 1);
                    unexpected = false;
                }

                if ((error || unexpected) && patterns['*']) {
                    error = cooMatchCommand(cmd, patterns, pos + 1);
                    unexpected = false;
                }

                return unexpected ? part : error;
        }
    } else {
        if (patterns['*']) {
            return patterns['*'].apply(cmd, parts);
        } else if (patterns['#']) {
            return patterns['#'].apply(cmd, parts);
        } else if (patterns['@']) {
            return patterns['@'].apply(cmd, parts);
        } else if (typeof patterns === 'function') {
            return patterns.apply(cmd, parts);
        } else {
            // Incomplete command.
            part = parts[parts.length - 1];
            error = new CooCommandPart(null, part._lineEnd, part._charEnd);
            error.error = 'Incomplete command';
            return error;
        }
    }
}


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
            cmd = new CooCommand(parent);

        for (i = 0; i < this.blockIndent; i++) {
            if (line[i] !== INDENT_WITH) {
                this.errorBadIndentation(i);
            }
        }

        i = this.blockIndent;

        if (line[i] === '+') {
            if (!parent || !parent.valueRequired) {
                // Pretty dumb error messages.
                this.error(
                    parent ?
                        '"' + parent.name + '" command does not require return value'
                        :
                        'No place to return value to',
                    i
                );
            } else {
                // This command pushes value to parent one.
                cmd.valuePusher = true;
                i++;
            }
        }

        if (line[i].match(/[a-zA-Z"'(_]/)) {
            var parts = cmd.parts = this.readCommandParts(i);

            if (parts[0].type === COO_COMMAND_PART_STRING ||
                parts[0].type === COO_COMMAND_PART_JS)
            {
                // Check for certain conditions in case command begins with
                // a string or with a JavaScript expression.
                if (parent && parent.valueRequired && cmd.valuePusher) {
                    // TODO: Implement.

                    if (parts.length > 1) { this.errorUnexpectedPart(parts[1]); }

                    this.nextLine();
                } else {
                    this.errorUnexpectedPart(parts[0]);
                }
            } else {
                // Match command and run it's callback.
                var errorPart;

                cmd.name = parts[0].value;

                if (parent && parent.processChild) {
                    errorPart = parent.processChild(cmd);
                } else if (cmd.name === 'JS') {
                    var self = this;

                    errorPart = cooMatchCommand(cmd, {
                        'JS': function() {
                            var val = self.readJS(self.blockIndent);
                            console.log(val.value);
                        }
                    });
                } else {
                    var cb = CooCoo.cmd[cmd.name];

                    if (cb) {
                        errorPart = cb(cmd);
                    } else {
                        errorPart = parts[0];
                    }
                }

                if (errorPart) {
                    this.errorUnexpectedPart(errorPart);
                }

                if (cmd.hasSubblock) {
                    this.readBlock(cmd);
                } else {
                    this.nextLine();
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
        var part = new CooCommandPart(COO_COMMAND_PART_STRING, this.lineAt, this.charAt),
            line = this.code[this.lineAt],
            startPos = this.charAt,
            starter = line[startPos];

        /* jshint -W109 */
        if (starter !== '"' && starter !== "'") {
        /* jshint +W109 */
            this.errorUnexpectedSymbol();
        }

        this.charAt++;

        while (this.charAt < line.length) {
            if (line[this.charAt] === starter && line[this.charAt - 1] !== '\\') {
                break;
            } else {
                this.charAt++;
            }
        }

        if (this.charAt < line.length) {
            part.value = line.substring(startPos, this.charAt + 1);
            this.charAt++;
            part._lineEnd = this.lineAt;
            part._charEnd = this.charAt + 1;
            this.skipWhitespaces();
        } else {
            this.error('Unterminated string', startPos);
        }

        return part;
    },

    readJS: function(indent) {
        var part = new CooCommandPart(COO_COMMAND_PART_JS, this.lineAt, this.charAt),
            val = [];

        if (!indent) {
            if (this.code[this.lineAt][this.charAt] !== '(') {
                this.errorUnexpectedSymbol();
            }

            var brackets,
                startLine = this.lineAt,
                startChar = this.charAt,
                inString;

            brackets = 1;
            this.charAt++;

            if ((this.charAt === this.code[this.lineAt].length) && !this.nextLine()) {
                this.error('Unterminated expression', startChar, startLine);
            }

            while (brackets > 0 && (this.charAt < this.code[this.lineAt].length)) {
                if (!inString) {
                    if (this.code[this.lineAt][this.charAt] === '(') {
                        brackets++;
                    } else if (this.code[this.lineAt][this.charAt] === ')') {
                        brackets--;

                        if (brackets === 0) {
                            this.charAt++;
                            break;
                        }
                    /* jshint -W109 */
                    } else if (this.code[this.lineAt][this.charAt] === '"' ||
                               this.code[this.lineAt][this.charAt] === "'")
                    /* jshint +W109 */
                    {
                        inString = this.code[this.lineAt][this.charAt];
                    }
                } else {
                    if (this.code[this.lineAt][this.charAt] === inString &&
                        this.code[this.lineAt][this.charAt - 1] !== '\\')
                    {
                        inString = false;
                    }
                }

                val.push(this.code[this.lineAt][this.charAt]);

                this.charAt++;

                if (this.charAt === this.code[this.lineAt].length) {
                    val.push('\n');

                    if (!this.nextLine()) {
                        this.error('Unterminated expression', startChar, startLine);
                    }
                }
            }

            part._lineEnd = this.lineAt;
            part._charEnd = this.charAt + 1;
            this.skipWhitespaces();

            val.unshift('(');
            val.push(')');
        } else {
            while (this.nextLine() && this.getIndent() > indent) {
                val.push(this.code[this.lineAt].substring(indent));
            }

            this.lineAt--;
            this.charAt = this.code[this.lineAt].length;

            part._lineEnd = this.lineAt;
            part._charEnd = this.charAt;
        }

        part.value = val.join(indent ? '\n' : '');

        return part;
    },

    readIdentifier: function() {
        var part = new CooCommandPart(COO_COMMAND_PART_IDENTIFIER, this.lineAt, this.charAt),
            line = this.code[this.lineAt],
            val = [line[this.charAt]];

        if (!line[this.charAt].match(/[a-zA-Z_]/)) {
            this.errorUnexpectedSymbol();
        }

        this.charAt++;

        while (this.charAt < line.length && line[this.charAt].match(/[a-zA-Z0-9_]/)) {
            val.push(line[this.charAt]);
            this.charAt++;
        }

        part._lineEnd = this.lineAt;
        part._charEnd = this.charAt + 1;
        this.skipWhitespaces();

        part.value = val.join('');

        return part;
    },

    readBlock: function(parent) {
        if (!this.nextLine()) {
            return false;
        }

        var oldIndent = this.blockIndent,
            indent,
            curIndent;

        indent = this.getIndent();

        if (indent > oldIndent) {
            this.blockIndent = indent;

            curIndent = indent;

            while (curIndent === indent) {
                this.readCommand(parent);
                curIndent = this.getIndent();
            }

            this.blockIndent = oldIndent;
        }
    },

    nextLine: function() {
        this.lineAt++;
        this.charAt = 0;

        return this.skipEmptyLines();
    },

    getIndent: function() {
        var indent = 0;

        if (this.lineAt < this.code.length) {
            while (this.code[this.lineAt][indent] === INDENT_WITH) {
                indent++;
            }
        }

        return indent;
    },

    skipWhitespaces: function() {
        var line = this.code[this.lineAt],
            whitespace = /[\x20\t\r\n\f]/;

        if (this.charAt < line.length && !line[this.charAt].match(whitespace)) {
            this.errorUnexpectedSymbol();
        }

        while (this.charAt < line.length && line[this.charAt].match(whitespace)) {
            this.charAt++;
        }
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
        this.error('Unexpected symbol', charAt === undefined ? this.charAt : charAt);
    },

    errorUnexpectedPart: function(part) {
        this.error(part.error || ('Unexpected ' + part.type), part._charAt, part._lineAt);
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


/* exported cooExtractParamNames */
function cooExtractParamNames(parts, start) {
    var params = {},
        i,
        part;

    for (i = start; i < parts.length; i++) {
        part = parts[i];

        if (part.value in params) {
            part.error = 'Duplicate parameter name';
            return {error: part};
        }

        params[part.value] = true;
    }

    return {params: params};
}


/* exported cooModelViewCollectionBase */
function cooModelViewCollectionBase(name, declExt, commandExt) {
    function cmdProcess(cmd) {
        if (cmd.parent) {
            return cmdProcessCommand(cmd);
        } else {
            // Template declaration.
            cmd.hasSubblock = true;
            cmd.processChild = cmdProcessDecl;

            cmd[name] = {
                properties: {},
                methods: {},
                construct: null,
                destruct: null
            };
        }
    }


    function cmdProcessDecl(cmd) {
        cmd.hasSubblock = true;
        cmd.valueRequired = true;

        cmd.method = {};

        return cooMatchCommand(cmd, extend({
            'CONSTRUCT': {
                '*': function() {
                    if (cmd.parent[name].construct) {
                        cmd.parts[0].error = 'Duplicate constructor';
                        return cmd.parts[0];
                    }

                    var params = cooExtractParamNames(cmd.parts, 1);
                    if (params.error) { return params.error; } else { params = params.params; }

                    cmd.parent[name].construct = true;

                    cmd.valueRequired = false;
                }
            },

            'DESTRUCT': function() {
                cmd.valueRequired = false;
                console.log('dede');
            },

            'PROPERTY': {
                '': {
                    '@': function() {
                        console.log('propro1');
                    },

                    '(': function() {
                        console.log('propro2');
                        cmd.hasSubblock = false;
                    },

                    '"': function() {
                        console.log('propro3');
                        cmd.hasSubblock = false;
                    }
                }
            },

            'METHOD': {
                '': {
                    '*': function() {
                        var params = cooExtractParamNames(cmd.parts, 2);
                        if (params.error) { return params.error; } else { params = params.params; }

                        console.log('mmmmm');
                    }
                }
            }
        }, declExt));
    }


    function cmdProcessCommand(cmd) {
        var pattern = {};

        pattern[name] = {
            '': {
                'CREATE': {
                    '@': function() {
                        cmd.hasSubblock = true;
                        cmd.valueRequired = false;

                        cmd.processChild = cmdProcessParamsAndEvents;
                    },

                    '#': function() {
                        // `NAME` identifier CREATE (expr1) (expr2) ...
                        //     ...

                        cmd.hasSubblock = true;
                        cmd.valueRequired = false;

                        var params = cooExtractParamNames(cmd.parts, 2);
                        if (params.error) { return params.error; } else { params = params.params; }

                        cmd.processChild = cmdProcessEvents;
                    }
                }
            },

            '(': {
                '@': function() {
                    // `NAME` (expr)
                    //     ...

                    cmd.hasSubblock = true;
                    cmd.valueRequired = false;

                    cmd.processChild = cmdProcessEvents;
                },

                'SET': {
                    '@': function() {
                        // `NAME` (something) SET
                        //     ...
                    },

                    '(': function() {
                        // `NAME` (something) SET (expr)
                    },

                    '"': function() {
                        // `NAME` (something) SET "text"
                    },

                    '': {
                        '@': function() {
                            // `NAME` (something) SET identifier

                            cmd.hasSubblock = true;
                            cmd.valueRequired = true;
                        },

                        '(': function() {
                            // `NAME` (something) SET identifier (expr)
                        },

                        '"': function() {
                            // `NAME` (something) SET identifier "text"
                        }
                    }
                },

                'GET': {
                    '@': function() {
                        // `NAME` (something) GET
                    },

                    '': function() {
                        // `NAME` (something) GET identifier
                    }
                },

                'CALL': {
                    '': {
                        '@': function() {
                            cmd.hasSubblock = true;
                            cmd.valueRequired = true;

                            cmd.processChild = cmdProcessParams;
                        },

                        '#': function() {
                        }
                    }
                },

                'DESTROY': function() {

                }
            },

            'SET': {
                '@': function() {
                    // `NAME` SET
                    //     ...
                },

                '(': function() {
                    // `NAME` SET (expr)
                },

                '"': function() {
                    // `NAME` SET "text"
                },

                '': {
                    '@': function() {
                        // `NAME` SET identifier
                        //     ...
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;
                    },

                    '(': function() {
                        // `NAME` SET identifier (expr)
                    },

                    '"': function() {
                        // `NAME` SET identifier "text"
                    }
                }
            },

            'GET': {
                '@': function() {
                    // `NAME` GET
                },

                '': function() {
                    // `NAME` GET identifier
                }
            },

            'CALL': {
                '': {
                    '@': function() {
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;

                        cmd.processChild = cmdProcessParams;
                    },

                    '#': function() {
                    }
                }
            },

            'DESTROY': function() {

            }
        };

        return cooMatchCommand(cmd, extend(pattern, commandExt));
    }


    function cmdProcessEvents(cmd) {
        return cooMatchCommand(cmd, {
            'ON': {
                '': {
                    '*': function() {
                        cmd.hasSubblock = true;
                    }
                }
            }
        });
    }


    function cmdProcessParams(cmd) {
        return cooMatchCommand(cmd, {
            'PARAM': {
                '': {
                    '@': function() {
                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;
                    },

                    '(': function() {
                    },

                    '"': function() {
                    }
                }
            }
        });
    }


    function cmdProcessParamsAndEvents(cmd) {
        var ret = cmdProcessEvents(cmd),
            ret2;

        if (ret) {
            ret2 = cmdProcessParams(cmd);
        }

        return ret2 ? ret : ret2;
    }


    CooCoo.cmd[name] = cmdProcess;
}


CooCoo.cmd = {};

module.exports = CooCoo;
