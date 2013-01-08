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
  }
};

exports.getProjects = function (req, res) {
  pivotalCache.getProjects(function (results) {
    res.json(results);
  });
};

exports.getIterations = function (req, res) {
  pivotalCache.getCurrentBacklogIterations(req.query.projectID, function (results) {
    res.json(results);
  });
};

exports.getStories = function (req, res) {
  pivotalCache.getStories(req.query.projectID, req.query.filter, function (results) {
    res.json(results);
  });
};

exports.updateStory = function (req, res) {
  pivotalCache.updateStory(req.body.projectID, req.body.storyID, req.body.data, function (results) {
    res.json(true);
  });
};

exports.addStoryComment = function (req, res) {
  pivotalCache.addStoryComment(req.body.projectID, req.body.storyID, req.body.comment, function (results) {
    res.json(true);
  });
};
