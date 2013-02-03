var importer = require('./importer.js');
var JiraApi = require('jira').JiraApi;
var pivotal = require('pivotal');

var JIRA_TO_PIVOTAL_STATE = {
  IceBox: 'unstarted',
  Started: 'started',
  Finished: 'finished',
  Delivered: 'delivered',
  Accepted: 'accepted',
  Rejected: 'rejected'
};

var JIRA_TO_PIVOTAL_TYPES = {
  Story: 'feature',
  Bug: 'bug',
  Chore: 'chore',
  Epic: 'release',
  'Technical task': 'chore'
};

exports.getImportableProjects = function (req, res) {
  var jira = new JiraApi('https', req.body.jiraHost, req.body.jiraPort, req.body.jiraUser, req.body.jiraPassword, '2');
  jira.listProjects(function (err, projects) {
    res.json(err || projects);
  });
};

exports.importProject = function (importID, body) {
  importer.importLog(importID, '[Fetching Pivotal Project] ' + body.pivotalProject);
  pivotal.getProject(body.pivotalProject, function (err, pivotalProject) {
    if (pivotalProject) {
      importProject(importID, pivotalProject, body);
    }
  });
};

var importProject = function (importID, pivotalProject, body) {
  var options = { startAt: 0, maxResults: 25, fields: ['*all'] };
  var jira = new JiraApi('https', body.jiraHost, body.jiraPort, body.jiraUser, body.jiraPassword, '2');
  jira.searchJira('project=' + body.jiraProject, options, function (err, response) {
    if (response && response.issues) {
      var state = { counter: response.startAt, errorCount: 0, successCount: 0, total: response.total };
      importer.importLog(importID, '[Importing] ' + response.startAt + '-' + Math.min(response.startAt + response.maxResults, response.total) + ' of ' + response.total + ' total issues from the "' + body.jiraProject + '" project');
      importIssues(importID, pivotalProject, response.issues, state);
    }
  });
};

var importIssues = function (importID, pivotalProject, issues, state) {
  if (issues.length === 0) {
    return;
  }

  var fields = issues[0].fields;
  var storyData = {
    name: fields.summary,
    estimate: convertEstimate(pivotalProject, fields.customfield_10004),
    description: fields.description,
    story_type: getIssueType(fields.issuetype),
    current_state: getIssueState(fields.status),
    requested_by: convertMember(pivotalProject, fields.reporter),
    owned_by: convertMember(pivotalProject, fields.assignee),
    created_at: fields.created ? pivotalDateFormat(fields.created) : '',
    updated_at: fields.updated ? pivotalDateFormat(fields.updated) : ''
  };

  if (fields.labels.length > 0) {
    storyData.labels = fields.labels.join(',');
  }

  importer.importLog(importID, '[' + state.counter + '][Adding story] ' + storyData.name);

  pivotal.addStory(pivotalProject.id, storyData, function (err, results) {
    if (err) {
      state.errorCount++;
      importer.importLog(importID, '[' + state.counter + '][Error] ' + err);
    } else {
      state.successCount++;
      importer.importLog(importID, '[' + state.counter + '][Success] assigned ID ' + results.id);
      console.log(JSON.stringify(err || results, null, 2));
    }
    state.counter++;
    issues.shift();
    setTimeout(function () {
      importIssues(importID, pivotalProject, issues, state);
    }, 100);
  });
};

var getIssueType = function (type) {
  return type && JIRA_TO_PIVOTAL_TYPES[type.name] ?
    JIRA_TO_PIVOTAL_TYPES[type.name] : 'feature';
};

var getIssueState = function (status) {
  return status && JIRA_TO_PIVOTAL_STATE[status.name] ?
    JIRA_TO_PIVOTAL_STATE[status.name] : 'unstarted';
};

var getPivotalNames = function (pivotalProject) {
  var names = [];
  var memberships = Array.isArray(pivotalProject.memberships.membership) ?
    pivotalProject.memberships.membership : [project.memberships.membership]

  for (var i = 0; i < memberships.length; i++) {
    names[names.length] = memberships[i].person.name;
  }

  return names;
};

var convertMember = function (pivotalProject, member) {
  var names = getPivotalNames(pivotalProject);

  if (member && member.displayName && names.indexOf(member.displayName) !== -1) {
    return member.displayName;
  }

  return '';
};

var convertEstimate = function (pivotalProject, estimate) {
  var valid_estimates = pivotalProject.point_scale.split(',');

  if (estimate && valid_estimates.indexOf(estimate) !== -1) {
    return estimate;
  }

  return '0';
};

var pivotalDateFormat = function (d) {
  function pad(n) {
    return n < 10 ? '0' + n : n
  }
  d = new Date(d);
  return d.getFullYear() + '/'
      + pad(d.getMonth() + 1) + '/'
      + pad(d.getDate()) + ' '
      + pad(d.getHours()) + ':'
      + pad(d.getMinutes()) + ':'
      + pad(d.getSeconds());
};
