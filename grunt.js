module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    concat: {
      'app/public/css/bundle/tt.css': [
        'app/public/css/yui-reset.css',
        'app/public/css/app.css'
      ],
      'app/public/js/bundle/tt.js': [
        'app/public/js/*.js'
      ],
      'app/public/js/bundle/lib.js': [
        'app/public/js/lib/jquery-1.8.3.min.js',
        'app/public/js/lib/jquery-ui-1.9.2.custom.min.js',
        'app/public/js/lib/jquery.cookie.js',
        'app/public/js/lib/hogan.js'
      ]
    },
    min: {
      dist: {
        src: ['app/public/js/bundle/tt.js'],
        dest: 'app/public/js/bundle/tt.min.js'
      }
    },
    lint: {
      all: ['app/public/js/*.js']
    },
    jshint: {
      options: {
        browser: true,
        curly: true,
        eqeqeq: true,
        forin: true,
        indent: 2,
        jquery: true,
        quotmark: 'single',
        undef: true,
        unused: false,
        trailing: true
      },
      globals: {
        TT: true,
        Hogan: true,
        HoganTemplates: true
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint concat min');

};
