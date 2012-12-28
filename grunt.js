module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    concat: {
      'app/public/js/tt.bundle.js': [
        'app/public/js/tt.js',
        'app/public/js/tt.ajax.js',
        'app/public/js/tt.api.js',
        'app/public/js/tt.dialog.js',
        'app/public/js/tt.draganddrop.js',
        'app/public/js/tt.model.js',
        'app/public/js/tt.search.js',
        'app/public/js/tt.ui.js',
        'app/public/js/tt.utils.js',
        'app/public/js/tt.view.js',
        'app/public/js/tt.init.js',
      ]
    },
    min: {
      dist: {
        src: ['app/public/js/tt.bundle.js'],
        dest: 'app/public/js/tt.bundle.min.js'
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
