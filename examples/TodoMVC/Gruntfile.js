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

        concat: {
            css: {
                src: 'src/**/*.css',
                dest: 'css/app.css'
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
            },

            css: {
                files: ['src/**/*.css'],
                tasks: ['concat']
            }
        }
    });

    grunt.loadNpmTasks('grunt-coocoo');
    grunt.loadNpmTasks('grunt-conkitty');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['coocoo', 'conkitty', 'concat', 'watch']);
};
