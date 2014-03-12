function cooClearComments(code) {
    var i,
        j,
        k,
        tmp,
        inComment,
        inString;

    i = 0;
    while (i < code.length) {
        tmp = code[i];

        if (!inComment) {
            inString = false;
            j = 0;

            while (j < tmp.length) {
                /* jshint -W109 */
                if (tmp[j] === "'" || tmp[j] === '"') {
                /* jshint +W109 */
                    if (inString === tmp[j] && tmp[j - 1] !== '\\') {
                        inString = false;
                        j++;
                        continue;
                    } else if (!inString) {
                        inString = tmp[j];
                        j++;
                        continue;
                    }
                }

                if (!inString) {
                    if (tmp[j] === '/' && (tmp[j + 1] === '/' || tmp[j + 1] === '*')) {
                        if (tmp[j + 1] === '*') {
                            k = tmp.indexOf('*/');

                            if (k > j) {
                                tmp = tmp.substring(0, j) + new Array(k + 3 - j).join(' ') + tmp.substring(k + 2);
                                continue;
                            } else {
                                inComment = true;
                            }
                        }

                        tmp = tmp.substring(0, j);
                        break;
                    }
                }

                j++;
            }

            code[i] = tmp;
        } else { // In comment.
            k = tmp.indexOf('*/');

            if (k >= 0) {
                code[i] = new Array(k + 3).join(' ') + tmp.substring(k + 2);
                inComment = false;
                i--;
            } else {
                code[i] = '';
            }
        }

        i++;
    }

    for (i = 0; i < code.length; i++) {
        code[i] = code[i].replace(/\s+$/g, '');
    }
}


var jsParser = require('uglify-js').parser,
    jsUglify = require('uglify-js').uglify,
    extend = require('deep-extend');


function fixVariableReferences(ast, vars) {
    if (!ast || !ast.length) { return; }

    var curVars = extend({}, vars),
        cur,
        i,
        j;

    for (i = 0; i < ast.length; i++) {
        cur = ast[i];

        if (cur instanceof Array) {
            if (cur[0] === 'var') {
                for (j = 0; j < cur[1].length; j++) {
                    // Delete we don't need to substitute this variable no more.
                    delete curVars[cur[1][j][0]];
                }
            }

            fixVariableReferences(cur, curVars);
        }

        if (cur && cur.length === 2 && cur[0] === 'name' && (cur[1] in curVars)) {
            // Replace reference.
            ast[i] = ['dot', ['name', '__args'], cur[1]];
        }
    }
}


function adjustJS(code, stripFunc, vars) {
    /* jshint -W106 */
    var ast = jsParser.parse(code);

    ast = jsUglify.ast_lift_variables(ast);
    fixVariableReferences(ast, vars);

    // Strip f() call.
    stripFunc(ast);

    return jsUglify.gen_code(ast, {beautify: true, indent_start: 4});
    /* jshint +W106 */
}


function adjustJSExpression(code, vars) {
    return adjustJS(
        'f(\n' + code + '\n)',
        function(ast) { ast[1] = ast[1][0][1][2]; /* Strip f() call. */ },
        vars
    );
}


function adjustJSFunction(code, vars) {
    return adjustJS(
        'function f() {\n' + code + '\n}',
        function(ast) { ast[1] = ast[1][0][3]; /* Strip function f() {} wrapper. */ },
        vars
    );
}


module.exports = {
    cooClearComments: cooClearComments,
    adjustJSExpression: adjustJSExpression,
    adjustJSFunction: adjustJSFunction
};
