var pivotal = require('pivotal');
var redis = require('redis');
var client = redis.createClient();

var CACHE_THRESHOLD = 1000 * 60; // 1 minute

var isExpired = function (timestamp) {
  return timestamp < (new Date().getTime() - CACHE_THRESHOLD);
};

exports.useToken = function (token) {
  pivotal.useToken(token);
};

exports.getProjects = function (callback) {
  var key = pivotal.token + '_projects';

  client.get(key, function (err, results) {
    if (results) {
      callback(results);
    } else {
      pivotal.getProjects(function (err, results) {
        results = JSON.stringify(results);

        client.set(key, results);
        callback(results);
      });
    }
  });
};

exports.getCurrentBacklogIterations = function (projectID, callback) {
  var key = pivotal.token + '_project_' + projectID + '_iterations';

  client.get(key, function (err, results) {
    var parsed_results = JSON.parse(results);
    var timestamp = parsed_results ? parsed_results.timestamp : null;

    if (!results || !timestamp || isExpired(timestamp)) {
      pivotal.getCurrentBacklogIterations(projectID, function (err, results) {
        results.timestamp = new Date().getTime();
        results = JSON.stringify(results);

        client.set(key, results);
        callback(results); 
      });
    } else {
      callback(results);
    }
  });
};

exports.getStories = function (projectID, callback) {
  var key = pivotal.token + '_project_' + projectID + '_stories';

  client.get(key, function (err, results) {
    if (results) {
      callback(results);
    } else {
      pivotal.getStories(projectID, { limit: 500 }, function (err, results) {
        results = JSON.stringify(results);

        client.set(key, results);
        callback(results);
      });
    }
  });
};

exports.updateStory = function (projectID, storyID, data, callback) {
  pivotal.updateStory(projectID, storyID, data, function (err, results) {
    if (results) {
      callback(results);
    }
  });
};
