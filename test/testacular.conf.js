// Testacular configuration
// Generated on Mon Dec 24 2012 11:42:55 GMT-0500 (EST)


// base path, that will be used to resolve files and exclude
basePath = '../';


// list of files / patterns to load in the browser
files = [
  JASMINE,
  JASMINE_ADAPTER,
  'test/beforeEach.js',
  'app/public/js/lib/jquery-1.8.3.min.js',
  'app/public/js/lib/jquery-ui-1.9.2.custom.min.js',
  'app/public/js/lib/jquery.cookie.js',
  'app/public/js/lib/hogan.js',
  'app/public/js/tt.js',
  'app/public/js/tt.*.js',
  'test/**/*.spec.coffee'
];


// list of files to exclude
exclude = [
  'app/public/js/tt.init.js'
];


preprocessors = {
  '**/*.coffee': 'coffee'
};


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress'];


// web server port
port = 8080;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = true;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['Chrome', 'Firefox', 'Safari'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 5000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;

