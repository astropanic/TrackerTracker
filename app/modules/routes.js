var pivotal = require('pivotal');
var JiraApi = require('jira').JiraApi;

var TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;
var PIVOTAL_TOKEN_COOKIE = 'pivotalToken';

var JIRA_TO_PIVOTAL_STATE = {
  IceBox: 'unstarted',
  Started: 'started',
  Finished: 'finished',
  Delivered: 'delivered',
  Accepted: 'accepted',
  Rejected: 'rejected'
}

var JIRA_TO_PIVOTAL_TYPES = {
  Story: 'feature',
  Bug: 'bug',
  Chore: 'chore',
  Epic: 'chore'
}

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
  jira.searchJira('project=' + req.body.jiraProject, ['*all'], function (error, result) {
    if (result) {
      importJiraIssues(res, req.body.pivotalProject, result.issues, 0);
    }
  });
};

importJiraIssues = function (res, pivotalProject, issues, issueCount) {
  if (issues.length === 0) {
    res.json(issueCount);
    return;
  }

  var jiraFields = issues[0].fields;
  console.log(JSON.stringify(jiraFields, null, '  '));

  var storyData = {
    name: jiraFields.summary,
    estimate: jiraFields.customfield_10004 || '0',
    description: jiraFields.description,
    story_type: jiraFields.issuetype ? JIRA_TO_PIVOTAL_TYPES[jiraFields.issuetype.name] : '',
    requested_by: jiraFields.reporter ? jiraFields.reporter.displayName : '',
    owned_by: jiraFields.assignee ? jiraFields.assignee.displayName : '',
    // created_at: "2013/02/01 11:49:51 UTC",
    // updated_at: "2013/02/01 11:49:51 UTC"
    current_state: JIRA_TO_PIVOTAL_STATE[jiraFields.status.name]
  }

  console.log(storyData);

  pivotal.addStory(pivotalProject, storyData, function (err, results) {
    if (results) {
      issueCount++
    }
    console.log(JSON.stringify(err || results, null, '  '));
    issues.shift();
    setTimeout(function () {
      importJiraIssues(res, pivotalProject, issues, issueCount);
    }, 100);
  });
}

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
