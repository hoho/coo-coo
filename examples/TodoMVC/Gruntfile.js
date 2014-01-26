module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        coocoo: {
            compile: {
                src: 'src/**/*.coo',
                dest: {
                    common: 'js/coo.js',
                    app:    'js/app.js',
                    debug:  true
                }
            }
        },

        conkitty: {
            compile: {
                files: {
                    'js/tpl.js': ['src/**/*.ctpl']
                }
            }
        },

        watch: {
            coo: {
                files: ['src/**/*.coo'],
                tasks: ['coocoo']
            },

            ctpl: {
                files: ['src/**/*.ctpl'],
                tasks: ['conkitty']
            }
        }
    });

    grunt.loadNpmTasks('grunt-coocoo');
    grunt.loadNpmTasks('grunt-conkitty');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['coocoo', 'conkitty', 'watch']);
};
