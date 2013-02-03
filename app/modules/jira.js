var importer = require('./importer.js');
var JiraApi = require('jira').JiraApi;
var pivotal = require('pivotal');
var queue = require('./simplequeue.js');

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
  Epic: 'chore', // 'release' throws a 422 error
  'Technical task': 'chore'
};

exports.getImportableProjects = function (req, res) {
  var jira = new JiraApi('https', req.body.jiraHost, req.body.jiraPort, req.body.jiraUser, req.body.jiraPassword, '2');
  jira.listProjects(function (err, projects) {
    res.json(err || projects);
  });
};

exports.importProject = function (importID, body) {
  importer.set(importID, 'startedAt', new Date().getTime());
  queue.finished = function () {
    importer.set(importID, 'finishedAt', new Date().getTime());
  };

  pivotal.getProject(body.pivotalProject, function (err, pivotalProject) {
    if (pivotalProject) {
      importProject(importID, pivotalProject, body);
    }
  });
};

var importProject = function (importID, pivotalProject, body, startAt) {
  startAt = startAt || 0;
  var batchSize = 10;
  var options = { startAt: startAt, maxResults: batchSize, fields: ['*all'] };
  var jira = new JiraApi('https', body.jiraHost, body.jiraPort, body.jiraUser, body.jiraPassword, '2');
  jira.searchJira('project=' + body.jiraProject, options, function (err, response) {
    if (response && response.issues) {
      importer.set(importID, 'totalIssues', response.total);
      importer.increment(importID, 'issuesFound', response.issues.length);
      for (var i = 0; i < response.issues.length; i++) {
        queue.push(importIssues, importID, pivotalProject, response.issues[i]);
      }
      queue.start();
      if (startAt + batchSize < response.total) {
        // queue.push(importProject, importID, pivotalProject, body, startAt + batchSize);
      }
    }
  });
};

var importIssues = function (importID, pivotalProject, issue) {
  var fields = issue.fields;
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

  pivotal.addStory(pivotalProject.id, storyData, function (err, results) {
    if (err) {
      importer.increment(importID, 'storyImportErrors', 1);
    } else {
      importer.increment(importID, 'storyImportSuccesses', 1);
      var comments = normalizePivotalCollection(fields.comment.comments);
      importer.increment(importID, 'commentsFound', comments.length);
      for (var i = 0; i < comments.length; i++) {
        queue.push(importComments, importID, pivotalProject, results.id, comments[i], i + 1);
      }
    }
    setTimeout(queue.next, 250);
  });
};

var importComments = function (importID, pivotalProject, storyID, comment) {
  var comment = convertJiraComment(comment);
  pivotal.addStoryComment(pivotalProject.id, storyID, comment, function (err, results) {
    if (err) {
      importer.increment(importID, 'commentImportErrors', 1);
    } else {
      importer.increment(importID, 'commentImportSuccesses', 1);
    }
    setTimeout(queue.next, 250);
  });
};

var convertJiraComment = function (comment) {
  var note = [
    comment.body,
    '',
    ' - ' + comment.author.displayName,
    pivotalDateFormat(comment.created)
  ];

  return note.join("\n");
};

var getIssueType = function (type) {
  return type && JIRA_TO_PIVOTAL_TYPES[type.name] ?
    JIRA_TO_PIVOTAL_TYPES[type.name] : 'feature';
};

var getIssueState = function (status) {
  return status && JIRA_TO_PIVOTAL_STATE[status.name] ?
    JIRA_TO_PIVOTAL_STATE[status.name] : 'unstarted';
};

var normalizePivotalCollection = function (collection) {
  return Array.isArray(collection) ? collection : [collection];
};

var getPivotalNames = function (pivotalProject) {
  var names = [];
  var memberships = normalizePivotalCollection(pivotalProject.memberships.membership);

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
  if (estimate && valid_estimates.indexOf(estimate + '') !== -1) {
    return estimate;
  }

  return '0';
};

var pad = function (n) {
  return n < 10 ? '0' + n : n;
};

var pivotalDateFormat = function (d) {
  d = new Date(d);
  return d.getFullYear() + '/'
    + pad(d.getMonth() + 1) + '/'
    + pad(d.getDate()) + ' '
    + pad(d.getHours()) + ':'
    + pad(d.getMinutes()) + ':'
    + pad(d.getSeconds());
};
