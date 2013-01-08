var express = require('express');
var http = require('http');
var routes = require('./modules/routes.js');

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('CDqHZyw4v8NPxUWoecuA'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function () {
  app.use(express.errorHandler()); 
});

app.get('/', routes.index);

app.get('/projects', routes.hasToken, routes.getProjects);
app.get('/iterations', routes.hasToken, routes.getIterations);
app.get('/stories', routes.hasToken, routes.getStories);

app.post('/updateStory', routes.hasToken, routes.updateStory);
app.post('/addStoryComment', routes.hasToken, routes.addStoryComment);

http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});
