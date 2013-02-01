var pivotal = require('pivotal');
var JiraApi = require('jira').JiraApi;

var TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;
var PIVOTAL_TOKEN_COOKIE = 'pivotalToken';

exports.getJiraProjects = function (req, res) {
  var jira = new JiraApi('https', req.body.jiraHost, req.body.jiraPort, req.body.jiraUser, req.body.jiraPassword, '2');
  console.log(JSON.stringify(req.body));
  jira.listProjects(function (err, projects) {
    console.log(JSON.stringify(err || projects, null, '  '));
    res.json(err || projects);
  });
};

exports.importJiraProject = function (req, res) {
  var jira = new JiraApi('https', req.body.jiraHost, req.body.jiraPort, req.body.jiraUser, req.body.jiraPassword, '2');
  console.log(JSON.stringify(req.body));
  jira.searchJira('project=' + req.body.jiraProject, null, function (error, result) {
    if (result) {
      for (i = 0; i < result.issues.length; i++) { 
        console.log(result.issues[i].fields.summary);
        var storyData = {name: result.issues[i].fields.summary};
        pivotal.addStory(req.body.pivotalProject, storyData, function (err, results) {
          console.log(JSON.stringify(err || results, null, '  '));
        });
      }
    }
  });

  res.json(true);
};

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
