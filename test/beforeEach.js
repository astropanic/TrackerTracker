var xsay = xalso = xdescribe;

var say = function(description, specDefinitions) {
    return jasmine.getEnv().describe('when ' + description + ',', specDefinitions);
};

var also = function(description, specDefinitions) {
    return jasmine.getEnv().describe('and ' + description + ',', specDefinitions);
};

var it = function(description, func) {
    return jasmine.getEnv().it('it ' + description, func);
};

var TT = TT || {};

TT.autoStart = false;
TT.disableStorySlideToggle = true;

TT.Mock = (function () {

  var pub = {};

  pub.projects = {
    project: [
      {
        id: "12345",
        name: "Dummy Project",
        labels: "green,red,blocked,passedqa",
        memberships: {
          membership: [
            {
              id: "100",
              person: {
                email: "nobody@example.com",
                name: "Product Manager",
                initials: "PM"
              },
              role: "Owner"
            },
            {
              id: "101",
              person: {
                email: "nobody@example.com",
                name: "Developer",
                initials: "DVL"
              },
              role: "Owner"
            }
          ]
        }
      }
    ]
  };

  pub.iterations = {
    iteration: [
      {
        id: '1',
        number: '1',
        start: '2012/12/23 23:00:00 EST',
        finish: '2013/01/06 23:00:00 EST',
        team_strength: '1',
        stories: {
          story: [
            {
              id: '101',
              project_id: '12345',
              story_type: 'feature',
              url: 'http://www.pivotaltracker.com/story/show/101',
              estimate: '1',
              current_state: 'delivered',
              description: 'Example Delivered Feature Description',
              name: 'Example Delivered Feature',
              requested_by: 'Product Manager',
              owned_by: 'Developer',
              created_at: '2012/10/26 17:28:19 EDT',
              updated_at: '2012/11/26 15:22:01 EST',
              labels: 'red',
              notes: {
                note: [
                  {
                    id: '31572297',
                    text: 'Example Note',
                    author: 'Developer',
                    noted_at: '2012/11/01 20:52:14 EDT'
                  }
                ]
              }
            },
            {
              id: '102',
              project_id: '12345',
              story_type: 'bug',
              url: 'http://www.pivotaltracker.com/story/show/102',
              estimate: '-1',
              current_state: 'unstarted',
              description: 'Example Unstarted Blocked Bug Description',
              name: 'Example Unstarted Blocked Bug',
              requested_by: 'Product Manager',
              created_at: '2012/10/26 17:28:19 EDT',
              updated_at: '2012/11/26 15:22:01 EST',
              labels: 'green,blocked',
              notes: {
                note: [
                  {
                    id: '31572297',
                    text: 'Example Note',
                    author: 'Product Manager',
                    noted_at: '2012/11/01 20:52:14 EDT'
                  }
                ]
              }
            },
            {
              id: '103',
              project_id: '12345',
              story_type: 'chore',
              url: 'http://www.pivotaltracker.com/story/show/102',
              estimate: '-1',
              current_state: 'started',
              description: 'Example Started Chore Description',
              name: 'Example Started Chore',
              requested_by: 'Product Manager',
              owned_by: 'Developer',
              created_at: '2012/10/26 17:28:19 EDT',
              updated_at: '2012/11/26 15:22:01 EST',
              labels: 'green',
              notes: {
                note: [
                  {
                    id: '31572297',
                    text: 'Note about Started Chore',
                    author: 'Developer',
                    noted_at: '2012/11/01 20:52:14 EDT'
                  }
                ]
              }
            }
          ]
        }
      }
    ],
    timestamp: 1356746505004
  };

  pub.serverResponse = function (url) {
    var urls = {
      '/projects': pub.projects,
      '/iterations': pub.iterations
    };

    return JSON.stringify(urls[url]);
  };

  return pub;

}());

function loadCSS() {
  var css = document.createElement('link');
  css.href = '/base/app/public/css/bundle/tt.css';
  css.rel = 'stylesheet';
  css.type = 'text/css';
  document.body.appendChild(css);
}

function visibleStoriesWithTag(tag) {
  return $('#columns .story').filter(function () {
    return $(this).text().indexOf(tag) !== -1;
  }).length;
}

function visibleStoriesWithoutTag(tag) {
  return $('#columns .story').filter(function () {
    return $(this).text().indexOf(tag) === -1;
  }).length;
}

function visibleStoriesWithoutOwner(name) {
  var count = 0;
  TT.Model.Story.each(function (index, story) {
    if (story.owned_by !== name && story.requested_by !== name) {
      if ($('.story-' + story.id).length > 0) {
        count++;
      }
    }
  });

  return count;
}

beforeEach(function () {
  spyOn(TT.Utils, 'localStorage')
  spyOn($, 'ajax').andCallFake(function (options) {
    options.success(TT.Mock.serverResponse(options.url));
  });
});

loadCSS();
TT.Init.onDomReady();
