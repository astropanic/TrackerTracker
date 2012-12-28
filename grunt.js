module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
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
  grunt.registerTask('default', 'lint');

};
