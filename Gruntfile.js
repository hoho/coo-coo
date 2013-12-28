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
                    'src/**/!(*_).js'
                ],
                dest: 'coo-coo.js'
            }
        },

        qunit: {
            all: ['test/**/*.html']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    grunt.registerTask('default', ['jshint', 'concat'/*, 'qunit'*/]);
};
