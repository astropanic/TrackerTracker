var TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;
var pivotal = require('pivotal');

exports.index = function (req, res) {
  // res.cookie('token', '82b949ab6afd7a843eef59b2c31b5165', { maxAge: TWO_YEARS });
  res.render('index');
};

exports.hasToken = function (req, res, next) {
  if (req.cookies.token) {
    pivotal.useToken(req.cookies.token);
    res.cookie('token', req.cookies.token, { maxAge: TWO_YEARS });
    next();
  } else {
    res.set('Content-Type', 'text/javascript');
    res.send('TT.UI.requestToken();');
  }
};

exports.useToken = function (req, res) {
  res.cookie('token', req.body.token, { maxAge: TWO_YEARS });
};

exports.getProjects = function (req, res) {
  pivotal.getProjects(function (err, results) {
    res.set('Content-Type', 'text/javascript');
    res.send('TT.API.setProjects(' + JSON.stringify(results) + ');');
  });
};

exports.getIterations = function (req, res) {
  var project = req.query.project || 57746;
  pivotal.getCurrentBacklogIterations(project, function (err, results) {
    res.set('Content-Type', 'text/javascript');
    res.send(results ? 'TT.API.addIterations(' + JSON.stringify(results) + ');' : '');
  });
};

exports.getStories = function (req, res) {
  var project = req.query.project || 57746;
  pivotal.getStories(project, { limit: 500 }, function (err, results) {
    res.set('Content-Type', 'text/javascript');
    res.send(results ? 'TT.API.addStories(' + JSON.stringify(results) + ');' : '');
  });
};
