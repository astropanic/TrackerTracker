var jira = require('./jira.js');
var redis = require("redis")
var redisClient = redis.createClient();

exports.getImportableProjects = function (req, res) {
  jira.getImportableProjects(req, res);
};

exports.importProject = function (req, res) {
  var importID = new Date().getTime();
  jira.importProject(importID, req.body);
  res.json({ id: importID });
};

exports.getImportLog = function (req, res) {
  redisClient.get(logKey(req.query.id), function (err, importLog) {
    res.json(importLog);
  });
};

exports.importLog = function (id, str) {
  console.log(str);
  redisClient.append(logKey(id), "\n[" + new Date().getTime() + ']' + str);
};

var logKey = function (id) {
  return 'TrackerTrackerImportLog' + id;
};
