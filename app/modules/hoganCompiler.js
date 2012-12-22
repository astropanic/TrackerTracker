var hogan = require('hogan.js');
var fs = require('fs');
var async = require('async');
require('sugar');

// Constants
var TEMPLATE_DIR = __dirname + '/../views/templates';

// Utility functions
var compileAllTemplates = function (callback) {
  var results = "var HoganTemplates = {};";

  fs.readdir(TEMPLATE_DIR, function (err, files) {
    if (err) return callback(err);

    var compileFile = function (file, done) {
      fs.readFile(TEMPLATE_DIR + '/' + file, function (err, contents) {
        if (err) return done(err);

        var compiled = hogan.compile(contents.toString(), { asString : true });
        var name = file.split('.').first();
        results = results + "\nHoganTemplates['" + name + "'] = " + compiled;
        done();
      });
    };

    async.forEach(files, compileFile, function (err) {
      if (err) return callback(err);
      callback(null, results);
    });
  });
};

// Exports
exports.getAll = function (req, res, next) {
  compileAllTemplates(function (err, templates) {
    if (err) return next(err);

    res.contentType('text/javascript');
    res.send(templates);
  });
};
