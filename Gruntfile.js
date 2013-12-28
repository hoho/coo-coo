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
            dist: {
                src: [
                    'src/core.js',
                    'src/**/!(*_|util).js'
                ],
                dest: 'dist/coo-coo.js'
            }
        },

        copy: {
            main: {
                expand: true,
                flatten: true,
                src: ['src/**/*_.js', 'src/util.js'],
                dest: 'dist/'
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

    grunt.registerTask('test', function() {
        var run = require('./test/test.js');
        run();
    });

    grunt.registerTask('default', ['jshint', 'concat', 'copy', 'test'/*, 'qunit'*/]);
};
