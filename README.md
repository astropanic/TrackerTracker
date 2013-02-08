# TrackerTracker

Multi-project Scrum UI for [Pivotal Tracker](http://www.pivotaltracker.com).

![Screenshot](http://i.imgur.com/01xTYQx.png)

## Features

* Simultaneously view and manage stories across multiple projects
* Scrum-like UI displays one column per story state, including "In QA" and "Passed QA"
* Search across all projects simultaneously
* Quickly drill down using any combination of projects, labels, users, and searches
* All labels for all projects are visible and have epic-like mini progress charts
* Columns can be rearranged
* Labels, searches, column order, selected projects all survive browser restart
* Enter your Pivotal API token and user name and off you go
* Most actions are supported: update story descriptions, add notes, drag them to different columns to update their status
* It's pretty easy to write custom columns and filters
* Forecasting charts

![Screenshot](http://i.imgur.com/ien0tEx.png)

## Who Is This For?

Companies like [a particular technology startup](http://www.intentmedia.com/) that use Pivotal Tracker and have multiple small projects going at once, but no good way to visualize and track progress across them all.

## Project Status

This should be considered beta software, use at your own risk. If you have any issues or feature requests, we would love to know, please [open an issue](http://github.com/intentmedia/TrackerTracker/issues). Contributions and pull requests are also very welcome.

## Demo

A demo install is up and running at [http://trackertracker.glomerate.com](http://trackertracker.glomerate.com). API tokens are not logged by the server. The only thing exposed in the server logs are project IDs, which are useless without proper access to them.

## Installation

### Ubuntu Server Install

```sh
aptitude update
aptitude install build-essential git-core nodejs npm redis-server
npm -g install grunt
npm -g install forever
git clone git@github.com:intentmedia/TrackerTracker.git
cd TrackerTracker
npm install
grunt
cd app
forever start --watch -l ~/forever.log -o ~/out.log -e ~/err.log app.js
```

### OS X Developer Install

1. Install **Homebrew**: [http://mxcl.github.com/homebrew/](http://mxcl.github.com/homebrew/)
2. Install **Redis**: `brew install redis`
3. Install **NodeJS**: [http://nodejs.org/](http://nodejs.org/)
4. Install **Grunt**: `npm -g install grunt`
5. Install **Testacular**: `npm -g install testacular`
6. Install **TrackerTracker**: `git clone git@github.com:intentmedia/TrackerTracker.git`
7. Install **NPM packages**: `cd TrackerTracker && npm install`

#### Running the app

```sh
cd TrackerTracker
grunt
cd app
node app
```

#### Running the Jasmine test suite manually

Assumes you have Chrome, Safari, and Firefox installed:

```sh
cd TrackerTracker/test
testacular run
```

#### Development

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

## Browser Support

TrackerTracker is tested and built for Chrome, Safari, and Firefox stable. It seems fine in IE 9, but broken in IE 10. (Progress!) Fluid's localStorage implementation doesn't survive a restart, so for now Fluid should be considered unsupported.

## Authors

* Andrew Childs ([@andrewchilds](http://twitter.com/andrewchilds))
* Adrian Cretu-Barbul ([@adriancb](http://twitter.com/adriancb))

## License

Copyright 2013 Andrew Childs

Licensed under the MIT License.
