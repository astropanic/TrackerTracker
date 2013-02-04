var url = require('url');
var fs = require('fs');

var importer = require('./importer.js');
var JiraApi = require('jira').JiraApi;
var pivotal = require('pivotal');
var request = require('request');
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
  var batchSize = 50;
  var options = { startAt: startAt, maxResults: batchSize, fields: ['*all'] };
  var jira = new JiraApi('https', body.jiraHost, body.jiraPort, body.jiraUser, body.jiraPassword, '2');
  var creds = { username: body.jiraUser, password: body.jiraPassword };
  var query = 'project=' + body.jiraProject +
    (body.updatedSince ? ' AND updated >= ' + body.updatedSince : '');

  jira.searchJira(query, options, function (err, response) {
    if (response && response.issues) {
      importer.set(importID, 'totalIssues', response.total);
      importer.increment(importID, 'issuesFound', response.issues.length);
      for (var i = 0; i < response.issues.length; i++) {
        queue.push(importIssue, importID, pivotalProject, response.issues[i], creds);
      }
      if (startAt + batchSize < response.total) {
        queue.push(importProject, importID, pivotalProject, body, startAt + batchSize);
      }
    }
    queue.next();
  });
};

var importIssue = function (importID, pivotalProject, issue, creds) {
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

  importer.set(importID, 'currentState', 'Importing story ' + fields.summary);

  if (fields.labels.length > 0) {
    storyData.labels = fields.labels.join(',');
  }

  pivotal.addStory(pivotalProject.id, storyData, function (err, results) {
    if (err) {
      importer.increment(importID, 'storyImportErrors', 1);
    } else {
      importer.increment(importID, 'storyImportSuccesses', 1);
      importCommentsAndAttachments(importID, pivotalProject.id, results.id, fields, creds);
    }
    setTimeout(queue.next, 250);
  });
};

var importCommentsAndAttachments = function (importID, projectID, storyID, fields, creds) {
  var comments = fields.comment.comments;
  var attachments = fields.attachment;
  var activity = consolidateCommentsAndAttachments(comments, attachments);

  importer.increment(importID, 'commentsFound', comments.length);
  importer.increment(importID, 'attachmentsFound', attachments.length);

  for (var i = 0; i < activity.length; i++) {
    var item = activity[i];
    var importFn = item.filename ? importAttachment : importComment;
    // unshift lets us skip ahead of previously queued story import jobs
    queue.unshift(importFn, importID, projectID, storyID, item, creds);
  }
};

var consolidateCommentsAndAttachments = function (comments, attachments) {
  var activity = [];

  for (var i = 0; i < comments.length; i++) {
    comments[i].timestamp = new Date(comments[i].created).getTime();
    activity.push(comments[i]);
  }

  for (var i = 0; i < attachments.length; i++) {
    attachments[i].timestamp = new Date(attachments[i].created).getTime();
    activity.push(attachments[i]);
  }

  return sortByProperty(activity, 'timestamp').reverse();
};

var importAttachment = function (importID, projectID, storyID, attachment, creds) {
  var fileName = attachment.content.split('/').pop();
  var tmpFile = '/tmp/lastTrackerTrackerImportFile';
  var stream = fs.createWriteStream(tmpFile);

  importer.set(importID, 'currentState', 'Downloading attachment ' + fileName);

  request(attachment.content, {
    auth: { user: creds.username, pass: creds.password }
  }).pipe(stream);

  stream.on('close', function () {
    console.log('close', arguments);
    importer.set(importID, 'currentState', 'Uploading attachment ' + fileName);
    var fileData = { name: fileName, path: tmpFile };
    pivotal.addStoryAttachment(projectID, storyID, fileData, function (err, results) {
      console.log(JSON.stringify(err || results, null, 2));
      importer.increment(importID, err ? 'attachmentImportErrors' : 'attachmentImportSuccesses', 1);
      setTimeout(queue.next, 250);
    });
  });

  stream.on('error', function () {
    importer.increment(importID, 'attachmentImportErrors', 1);
    console.log('error', arguments);
    setTimeout(queue.next, 250);
  });
};

var importComment = function (importID, projectID, storyID, comment) {
  importer.set(importID, 'currentState', 'Importing comment.');
  var comment = convertJiraComment(comment);
  pivotal.addStoryComment(projectID, storyID, comment, function (err, results) {
    importer.increment(importID, err ? 'commentImportErrors' : 'commentImportSuccesses', 1);
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

var pivotalDateFormat = function (d) {
  d = new Date(d);
  return d.getFullYear() + '/'
    + pad(d.getMonth() + 1) + '/'
    + pad(d.getDate()) + ' '
    + pad(d.getHours()) + ':'
    + pad(d.getMinutes()) + ':'
    + pad(d.getSeconds());
};

var pad = function (n) {
  return n < 10 ? '0' + n : n;
};

var sortByProperty = function (arr, prop) {
  return arr.sort(function (a, b) {
    return a[prop] > b[prop] ? 1 : a[prop] === b[prop] ? 0 : -1;
  });
};
