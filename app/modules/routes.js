var pivotal = require('pivotal');

var TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;
var PIVOTAL_TOKEN_COOKIE = 'pivotalToken';

exports.index = function (req, res) {
  res.render('index', { timestamp: new Date().getTime() });
};

exports.hasToken = function (req, res, next) {
  if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
    pivotal.useToken(req.cookies[PIVOTAL_TOKEN_COOKIE]);
    res.cookie(PIVOTAL_TOKEN_COOKIE, req.cookies[PIVOTAL_TOKEN_COOKIE], { maxAge: TWO_YEARS });
    next();
  }
};

exports.getProjects = function (req, res) {
  pivotal.getProjects(function (err, results) {
    res.json(results || {});
  });
};

exports.getIterations = function (req, res) {
  pivotal.getCurrentBacklogIterations(req.query.projectID, function (err, results) {
    res.json(results || {});
  });
};

exports.getStories = function (req, res) {
  pivotal.getStories(req.query.projectID, { limit: 500, filter: req.query.filter }, function (err, results) {
    res.json(results || {});
  });
};

exports.addStory = function (req, res) {
  pivotal.addStory(req.body.projectID, req.body.data, function (err, results) {
    res.json(true);
  });
};

exports.updateStory = function (req, res) {
  pivotal.updateStory(req.body.projectID, req.body.storyID, req.body.data, function (err, results) {
    res.json(true);
  });
};

exports.addStoryComment = function (req, res) {
  pivotal.addStoryComment(req.body.projectID, req.body.storyID, req.body.comment, function (err, results) {
    res.json(true);
  });
};
