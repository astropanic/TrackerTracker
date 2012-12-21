var TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;
var pivotal = require('pivotal');

var PIVOTAL_TOKEN_COOKIE = 'pivotalToken';

exports.index = function (req, res) {
  res.render('index');
};

exports.hasToken = function (req, res, next) {
  if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
    pivotal.useToken(req.cookies[PIVOTAL_TOKEN_COOKIE]);
    res.cookie(PIVOTAL_TOKEN_COOKIE, req.cookies[PIVOTAL_TOKEN_COOKIE], { maxAge: TWO_YEARS });
    next();
  } else {
    res.set('Content-Type', 'text/javascript');
    res.send('TT.UI.requestToken();');
  }
};

exports.useToken = function (req, res) {
  res.cookie(PIVOTAL_TOKEN_COOKIE, req.body[PIVOTAL_TOKEN_COOKIE], { maxAge: TWO_YEARS });
  res.set('Content-Type', 'text/javascript');
  res.send('TT.Ajax.end();');
};

exports.getProjects = function (req, res) {
  pivotal.getProjects(function (err, results) {
    res.set('Content-Type', 'text/javascript');
    res.send('TT.API.setProjects(' + JSON.stringify(results) + ');');
  });
};

exports.getIterations = function (req, res) {
  pivotal.getCurrentBacklogIterations(req.query.project, function (err, results) {
    res.set('Content-Type', 'text/javascript');
    res.send(results ? 'TT.API.addIterations(' + JSON.stringify(results) + ');' : '');
  });
};

exports.getStories = function (req, res) {
  pivotal.getStories(req.query.project, { limit: 500 }, function (err, results) {
    res.set('Content-Type', 'text/javascript');
    res.send(results ? 'TT.API.addStories(' + JSON.stringify(results) + ');' : '');
  });
};

exports.updateStory = function (req, res) {
  pivotal.updateStory(req.query.project_id, req.query.story_id, req.query.data, function (err, results) {
    res.set('Content-Type', 'text/javascript');
    res.send('TT.Ajax.end();');
  });
};
