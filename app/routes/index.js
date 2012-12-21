var TWO_YEARS = 2 * 365 * 24 * 60 * 60 * 1000;
var PIVOTAL_TOKEN_COOKIE = 'pivotalToken';

var pivotal = require('pivotal');
var redis = require("redis"), client = redis.createClient();
var _ = require('underscore');

exports.index = function (req, res) {
  res.render('index');
};

exports.hasToken = function (req, res, next) {
  if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
    pivotal.useToken(req.cookies[PIVOTAL_TOKEN_COOKIE]);
    res.cookie(PIVOTAL_TOKEN_COOKIE, req.cookies[PIVOTAL_TOKEN_COOKIE], { maxAge: TWO_YEARS });
    next();
  } else {
    res.set('Content-Type', 'text/javascript');
    res.send('TT.UI.requestToken();');
  }
};

exports.useToken = function (req, res) {
  res.cookie(PIVOTAL_TOKEN_COOKIE, req.body[PIVOTAL_TOKEN_COOKIE], { maxAge: TWO_YEARS });
  res.set('Content-Type', 'text/javascript');
  res.send('TT.Ajax.end();');
};

exports.getProjects = function (req, res) {
  projectsKey = pivotal.token + '_projects';
  projects = null;

  var callback = function (results) {
    res.set('Content-Type', 'text/javascript');
    res.send('TT.API.setProjects(' + results + ');');
  };

  client.get(projectsKey, function (err, results) {
    if (_.isEmpty(results)) {
      pivotal.getProjects(function (err, results) {
        resultsAsJson = JSON.stringify(results);

        client.set(projectsKey, resultsAsJson);
        callback(resultsAsJson); 
      });
    } else {
      callback(results);
    };
  });
};

exports.getIterations = function (req, res) {
  iterationsKey = pivotal.token + '_project_' + req.query.project + '_iterations';

  var callback = function (results) {
    res.set('Content-Type', 'text/javascript');
    res.send(results ? 'TT.API.addIterations(' + results + ');' : '');
  }

  client.get(iterationsKey, function (err, results) {
    if (_.isEmpty(results)) {
      pivotal.getCurrentBacklogIterations(req.query.project, function (err, results) {
        resultsAsJson = JSON.stringify(results);

        client.set(iterationsKey, resultsAsJson);
        callback(resultsAsJson); 
      });
    } else {
      callback(results);
    };

  });
};

exports.getStories = function (req, res) {
  storiesKey = pivotal.token + '_project_' + req.query.project + '_stories';

  var callback = function (results) {
    res.set('Content-Type', 'text/javascript');
    res.send(results ? 'TT.API.addStories(' + results + ');' : '');
  }

  client.get(storiesKey, function (err, results) {
    if (_.isEmpty(results)) {
      pivotal.getStories(req.query.project, { limit: 500 }, function (err, results) {
        resultsAsJson = JSON.stringify(results);

        client.set(storiesKey, resultsAsJson);
        callback(resultsAsJson); 
      });
    } else {
      callback(results);
    };

  });
};

exports.updateStory = function (req, res) {
  pivotal.updateStory(req.query.project_id, req.query.story_id, req.query.data, function (err, results) {
    res.set('Content-Type', 'text/javascript');
    res.send('TT.Ajax.end();');
  });
};
