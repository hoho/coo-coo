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


module.exports = {
    cooClearComments: cooClearComments
};
