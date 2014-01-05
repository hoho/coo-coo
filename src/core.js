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


function CooCommand(file, parent) {
    this.file = file;

    if (parent) {
        this.root = parent.root || parent;
        this.method = parent.method;
    }

    this.parent = parent;
    this.children = [];
}

CooCommand.prototype = {
    root: null,
    method: null,
    valuePusher: false,
    valueRequired: false,
    hasSubblock: false,
    parts: null,
    processChild: null,

    data: null,

    getDeclKey: null,

    getCodeBefore: null,
    getCodeAfter: null
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
            return patterns['*'](cmd);
        } else if (patterns['#']) {
            return patterns['#'](cmd);
        } else if (patterns['@']) {
            return patterns['@'](cmd);
        } else if (typeof patterns === 'function') {
            return patterns(cmd);
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
            cmd = new CooCommand(this, parent);

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
                    var commandHandlers = CooCoo.cmd[cmd.name];

                    if (commandHandlers.base) {
                        this.ret.base[commandHandlers.base] = true;
                    }

                    if (commandHandlers.arrange) {
                        this.ret.arrange[cmd.name] = commandHandlers.arrange;
                    }

                    if (commandHandlers && commandHandlers.process) {
                        errorPart = commandHandlers.process(cmd);
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

            if (!parent) {
                if (cmd.getDeclKey) {
                    var declKey = cmd.getDeclKey(),
                        decls = this.ret.declCmd[declKey.first];

                    if (!decls) {
                        this.ret.declCmd[declKey.first] = decls = {};
                    }

                    if (declKey.last in decls) {
                        cmd.parts[0].error = 'Redeclaration';
                        this.errorUnexpectedPart(cmd.parts[0]);
                    } else {
                        decls[declKey.last] = cmd;
                    }
                } else {
                    this.ret.cmd.push(cmd);
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


function cooRunGenerators(cmd, code, level) {
    var c = cmd.children,
        i,
        indent = (new Array(level)).join(INDENT);

    if (cmd.getCodeBefore) {
        code.push(indent + cmd.getCodeBefore());
    }

    if (c) {
        for (i = 0; i < c.length; i++) {
            cooRunGenerators(c[i], code, level + 1);
        }
    }

    if (cmd.getCodeAfter) {
        code.push(indent + cmd.getCodeAfter());
    }
}


function CooCoo(filenames, commons, project) {
    CooCoo.decl = {};

    var ret = {
        base: {core: true},
        arrange: {},
        declCmd: {},
        cmd: []
    };

    var i,
        file,
        tmp,
        code = [];

    for (i = 0; i < filenames.length; i++) {
        file = new CooFile(filenames[i]);
        file.read(ret);
    }

    tmp = ret.arrange;
    for (i in tmp) {
        tmp[i](file, ret.declCmd, ret.cmd);
    }

    tmp = ret.cmd;
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

        if (part.type !== COO_COMMAND_PART_IDENTIFIER) {
            return {error: part};
        }

        if (part.value in params) {
            part.error = 'Duplicate parameter name';
            return {error: part};
        }

        params[part.value] = true;
    }

    return {params: params};
}


/* exported cooExtractParamValues */
function cooExtractParamValues(parts, start) {
    var values = [],
        i,
        part;

    for (i = start; i < parts.length; i++) {
        part = parts[i];

        if (part.type === COO_COMMAND_PART_IDENTIFIER) {
            return {error: part};
        }

        values.push(part.value);
    }

    return {values: values};
}


/* exported cooModelViewCollectionBase */
function cooModelViewCollectionBase(name, declExt, commandExt) {
    function cmdProcess(cmd) {
        if (cmd.parent) {
            return cmdProcessCommand(cmd);
        } else {
            var patterns = {},
                error,
                exts;

            patterns[name] = {
                '': {
                    '@': function() {
                        // `NAME` identifier
                    },

                    'EXTENDS': {
                        '': function() {
                            // `NAME` identifier EXTENDS identifier2
                            exts = cmd.parts[3].value;
                        }
                    }
                }
            };

            error = cooMatchCommand(cmd, patterns);

            if (error) {
                return error;
            }

            cmd.getDeclKey = function() {
                return {first: cmd.parts[0].value, last: cmd.parts[1].value};
            };

            // Template declaration.
            cmd.hasSubblock = true;
            cmd.processChild = cmdProcessDecl;

            cmd.data = {
                name: cmd.parts[1].value,
                exts: exts,
                construct: null,
                destruct: null,
                properties: {},
                methods: {}
            };

            var storageName = name[0].toUpperCase() + name.substring(1).toLowerCase();

            cmd.getCodeBefore = function() {
                // CooCoo.View["Identifier"] =
                var ret = ['CooCoo.' + storageName + '["' + cmd.parts[1].value + '"] = '];

                if (exts) {
                    // CooCoo.View["Identifier"]
                    ret.push('CooCoo.' + storageName + '["' + exts + '"]');
                } else {
                    // CooCoo.ViewBase
                    ret.push('CooCoo.' + storageName + 'Base');
                }

                // .extend({
                ret.push('.extend({');

                return ret.join('');
            };

            cmd.getCodeAfter = function() {
                return '});\n';
            };
        }
    }


    function cmdProcessDecl(cmd) {
        cmd.method = {};

        function setupProperty() {
            var props = cmd.parent.data.properties,
                part = cmd.parts[1];

            if (part.value in props) {
                part.error = 'Duplicate property';
                return part;
            }

            var params = cooExtractParamValues(cmd.parts, 2);

            if (params.error) {
                return params.error;
            }

            props[part.value] = {
                value: params.values.length ? params.values[0] : undefined
            };
        }

        return cooMatchCommand(cmd, extend({
            'CONSTRUCT': {
                '*': function() {
                    cmd.hasSubblock = true;

                    if (cmd.parent.data.construct) {
                        cmd.parts[0].error = 'Duplicate constructor';
                        return cmd.parts[0];
                    }

                    var params = cooExtractParamNames(cmd.parts, 1);
                    if (params.error) { return params.error; } else { params = params.params; }

                    cmd.parent.data.construct = true;
                }
            },

            'DESTRUCT': function() {
                cmd.hasSubblock = true;

                if (cmd.parent.data.destruct) {
                    cmd.parts[0].error = 'Duplicate destructor';
                    return cmd.parts[0];
                }

                cmd.parent.data.destruct = true;
            },

            'PROPERTY': {
                '': {
                    '@': function() {
                        var error = setupProperty();
                        if (error) { return error; }

                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;
                    },

                    '(': function() {
                        var error = setupProperty();
                        if (error) { return error; }
                    },

                    '"': function() {
                        var error = setupProperty();
                        if (error) { return error; }
                    }
                }
            },

            'METHOD': {
                '': {
                    '*': function() {
                        var methods = cmd.parent.data.methods,
                            part = cmd.parts[1];

                        if (part.value in methods) {
                            part.error = 'Duplicate method';
                            return part;
                        }

                        cmd.hasSubblock = true;
                        cmd.valueRequired = true;

                        var params = cooExtractParamNames(cmd.parts, 2);
                        if (params.error) { return params.error; } else { params = params.params; }
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

                        cmd.processChild = cmdProcessParamsAndEvents;
                    },

                    '#': function() {
                        // `NAME` identifier CREATE (expr1) (expr2) ...
                        //     ...

                        cmd.hasSubblock = true;

                        var params = cooExtractParamValues(cmd.parts, 3);
                        if (params.error) { return params.error; } else { params = params.values; }

                        cmd.processChild = cmdProcessEvents;
                    }
                },

                '(': {
                    '@': function() {
                        // `NAME` identifier (expr)
                        //     ...

                        cmd.hasSubblock = true;

                        cmd.processChild = cmdProcessEvents;
                    },

                    'SET': {
                        '@': function() {
                            // `NAME` identifier (something) SET
                            //     ...
                        },

                        '(': function() {
                            // `NAME` identifier (something) SET (expr)
                        },

                        '"': function() {
                            // `NAME` identifier (something) SET "text"
                        },

                        '': {
                            '@': function() {
                                // `NAME` identifier (something) SET identifier

                                cmd.hasSubblock = true;
                                cmd.valueRequired = true;
                            },

                            '(': function() {
                                // `NAME` identifier (something) SET identifier (expr)
                            },

                            '"': function() {
                                // `NAME` identifier (something) SET identifier "text"
                            }
                        }
                    },

                    'GET': {
                        '@': function() {
                            // `NAME` identifier (something) GET
                        },

                        '': function() {
                            // `NAME` identifier (something) GET identifier
                        }
                    },

                    'CALL': {
                        '': {
                            '@': function() {
                                // `NAME` identifier (something) CALL identifier
                                //     ...
                                cmd.hasSubblock = true;
                                cmd.valueRequired = true;

                                cmd.processChild = cmdProcessParams;
                            },

                            '#': function() {
                                // `NAME` identifier (something) CALL identifier (expr) (expr) ...
                            }
                        }
                    },

                    'DESTROY': function() {
                        // `NAME` identifier (something) DESTROY
                    }
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


    CooCoo.cmd[name] = {
        process: cmdProcess,
        arrange: function(file, declCmd, cmdList) {
            var decls = declCmd[name],
                arranged = {},
                initialName,
                key,
                cmd,
                props,
                depProps,
                depCmd;

            for (key in decls) {
                cmd = decls[key];
                props = cmd.data;

                if (props.exts) {
                    depCmd = cmd;
                    depProps = props;
                    initialName = depProps.name;

                    while (depProps.exts) {
                        if (depProps.exts in decls) {
                            if (depProps.exts === initialName) {
                                depCmd.parts[3].error = 'Circular dependency';
                                depCmd.file.errorUnexpectedPart(depCmd.parts[3]);
                            }
                        } else {
                            depCmd.parts[3].error = 'Dependency is not declared';
                            depCmd.file.errorUnexpectedPart(depCmd.parts[3]);
                        }

                        if (!(arranged[depProps.exts])) {
                            arranged[depProps.exts] = decls[depProps.exts];
                        }
                        depCmd = decls[depProps.exts];
                        depProps = decls[depProps.exts].data;
                    }
                }

                if (!(props.name in arranged)) {
                    arranged[props.name] = cmd;
                }
            }


            cmd = [];
            for (key in arranged) {
                cmd.push(arranged[key]);
            }

            Array.prototype.splice.apply(cmdList, [0, 0].concat(cmd));
        },
        base: name.toLowerCase()
    };
}


CooCoo.cmd = {};

module.exports = CooCoo;
