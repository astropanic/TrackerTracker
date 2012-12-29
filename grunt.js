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
    hogan: {
      compile: {
        namespace: 'HoganTemplates',
        src: ['app/views/templates/*.html'],
        dest: 'app/public/js/bundle/hoganTemplates.js'
      }
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
    },
    watch: {
      files: [
        'app/public/css/*',
        'app/public/js/*',
        'app/views/templates/*'
      ],
      tasks: 'default'
    }
  });

  grunt.registerMultiTask('hogan', 'Pre-compile hogan.js templates', function () {
    var Hogan = require('hogan.js');
    var path = require('path');
    var data = this.data;

    var namespace = data.namespace || 'HoganTemplates';
    var output = 'var ' + namespace + ' = {};';

    grunt.file.expand(data.src).forEach(function (template) {
      var name = path.basename(template, path.extname(template));
      try {
        output += "\n" + namespace + "['" + name + "'] = " +
          Hogan.compile(grunt.file.read(template).toString(), { asString: true }) + ';';
      } catch (error) {
        grunt.log.writeln('Error compiling template ' + name + ' in ' + template);
        throw error;
      }
    });
    grunt.file.write(data.dest, output);
  });

  // Default task.
  grunt.registerTask('default', 'lint hogan concat min');

};
