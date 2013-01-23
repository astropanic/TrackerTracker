# TrackerTracker

Multi-project Scrum UI for Pivotal Tracker.

This is beta software. Use at your own risk. If you have any issues or feature requests, please let us know by [opening an issue](http://github.com/intentmedia/TrackerTracker/issues).

## OS X Developer Install

1. Install **Homebrew**: [http://mxcl.github.com/homebrew/](http://mxcl.github.com/homebrew/)
2. Install **NodeJS**: [http://nodejs.org/](http://nodejs.org/)
3. Install **Redis**: `brew install redis`
4. Install **Grunt**: `npm -g install grunt`
5. Install **Testacular**: `npm -g install testacular`
6. Install **TrackerTracker**: `git clone git@github.com:intentmedia/TrackerTracker.git`
7. Install **NPM packages**: `cd TrackerTracker && npm install`

### Running the app

```sh
cd TrackerTracker
grunt
cd app
node app
```

### Running the Jasmine test suite manually

Assumes you have Chrome, Safari, and Firefox installed:

```sh
cd TrackerTracker/test
testacular run
```

### Development

1. Have Testacular auto-run on file changes

```sh
cd TrackerTracker/test
testacular start
```

2. Have Grunt auto-run (jshint, concat, hogan compile) on file changes

```sh
cd TrackerTracker
grunt watch
```

## Ubuntu Server Install

```sh
aptitude update
aptitude install build-essential redis-server git-core nodejs npm
npm -g install grunt
npm -g install forever
git clone git@github.com:intentmedia/TrackerTracker.git
cd TrackerTracker
grunt
cd app
forever start -l ~/forever.log -o ~/out.log -e ~/err.log app.js
```
