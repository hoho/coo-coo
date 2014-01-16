module.exports = function(grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            all: {
                src: ['src/**/*.js', 'Gruntfile.js'],
                options: {
                    jshintrc: '.jshintrc'
                }
            }
        },

        concat: {
            lib: {
                src: [
                    'src/core.js',
                    'src/**/!(*_|util).js'
                ],
                dest: 'lib/coocoo.js'
            }
        },

        copy: {
            main: {
                expand: true,
                flatten: true,
                src: ['src/**/*_.js', 'src/util.js'],
                dest: 'lib/'
            }
        },

        watch: {
            scripts: {
                files: ['src/**/*.js'],
                tasks: ['concat', 'copy', 'test']
            },

            coo: {
                files: ['examples/**/*.coo'],
                tasks: ['test']
            },

            templates: {
                files: ['test/**/*.ctpl'],
                tasks: ['conkitty']
            }
        },

        conkitty: {
            compile: {
                files: {
                    'test/test-tpl.js': ['test/test.ctpl']
                }
            }
        },

        qunit: {
            all: ['test/**/*.html']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-conkitty');

    grunt.registerTask('build', ['jshint', 'concat', 'copy']);

    grunt.registerTask('test', function() {
        var run = require('./test/test.js');
        run();
    });

    grunt.registerTask('default', ['build', 'test', 'conkitty', 'watch' /*, 'qunit'*/]);
};
