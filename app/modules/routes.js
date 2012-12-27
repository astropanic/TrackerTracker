var TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;
var PIVOTAL_TOKEN_COOKIE = 'pivotalToken';

var pivotalCache = require('./pivotalCache.js');

exports.index = function (req, res) {
  res.render('index');
};

exports.hasToken = function (req, res, next) {
  if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
    pivotalCache.useToken(req.cookies[PIVOTAL_TOKEN_COOKIE]);
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
  pivotalCache.getProjects(function (results) {
    res.json(results);
  });
};

exports.getIterations = function (req, res) {
  pivotalCache.getCurrentBacklogIterations(req.query.project, function (results) {
    res.json(results);
  });
};

exports.getStories = function (req, res) {
  pivotalCache.getStories(req.query.project, { limit: 500 }, function (results) {
    res.json(results);
  });
};

exports.updateStory = function (req, res) {
  pivotalCache.updateStory(req.body.project_id, req.body.story_id, req.body.data, function (results) {
    res.set('Content-Type', 'text/javascript');
    res.send('{}');
  });
};
