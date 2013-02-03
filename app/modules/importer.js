var jira = require('./jira.js');
var redis = require('redis');
var client = redis.createClient();

var logKey = function (id) {
  return 'TrackerTrackerImportLog' + id;
};

exports.getImportableProjects = function (req, res) {
  jira.getImportableProjects(req, res);
};

exports.importProject = function (req, res) {
  var importID = new Date().getTime();
  jira.importProject(importID, req.body);
  res.json({ id: importID });
};

exports.getImportLog = function (req, res) {
  client.hgetall(logKey(req.query.id), function (err, json) {
    res.json(json || { error: true });
  });
};

exports.increment = function (id, key, val) {
  console.log('redis.hincrby', id, key, val);
  client.hincrby(logKey(id), key, val);
};

exports.set = function (id, key, val) {
  console.log('redis.hset', id, key, val);
  client.hset(logKey(id), key, val);
};
