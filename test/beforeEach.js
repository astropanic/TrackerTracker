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

TT.Mock = (function () {

  var pub = {};

  pub.projects = function () {
    return {
      project: [
        {
          id: "12345",
          name: "Dummy Project",
          labels: "green,red,blocked,passedqa,used_by_one_story,unused_label",
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
        },
        {
          id: "123456",
          name: "Another Project",
          labels: "green,red,blocked,passedqa,{ qa }",
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
        },
        {
          id: "1234567",
          name: "Project Without Labels",
          labels: {},
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
  };

  pub.iterations_12345 = function () {
    return {
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
                labels: 'green,used_by_one_story',
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
              },
              {
                id: '201',
                project_id: '123456',
                story_type: 'feature',
                url: 'http://www.pivotaltracker.com/story/show/201',
                estimate: '1',
                current_state: 'accepted',
                description: 'Example Accepted Feature in Another Project',
                name: 'Example Accepted Feature in Another Project',
                requested_by: 'Product Manager',
                owned_by: 'Developer',
                created_at: '2012/10/26 17:28:19 EDT',
                updated_at: '2012/11/26 15:22:01 EST',
                labels: '{ qa }',
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
              }
            ]
          }
        }
      ]
    };
  };

  pub.iterations_123456 = function () {
    return {
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
                id: '201',
                project_id: '123456',
                story_type: 'feature',
                url: 'http://www.pivotaltracker.com/story/show/201',
                estimate: '1',
                current_state: 'accepted',
                description: 'Example Accepted Feature in Another Project',
                name: 'Example Accepted Feature in Another Project',
                requested_by: 'Product Manager',
                owned_by: 'Developer',
                created_at: '2012/10/26 17:28:19 EDT',
                updated_at: '2012/11/26 15:22:01 EST',
                labels: '{ qa }',
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
              }
            ]
          }
        }
      ]
    };
  };

  pub.serverResponse = function (url, data) {
    data = data || {};
    var urls = {
      '/projects': pub.projects,
      '/iterations': pub['iterations_' + data.projectID]
    };

    return urls[url] ? urls[url](data) : {};
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
    return $('.tag', this).text().indexOf(tag) !== -1;
  }).length;
}

function visibleStoriesWithoutTag(tag) {
  return $('#columns .story').filter(function () {
    return $('.tag', this).text().indexOf(tag) === -1;
  }).length;
}

function visibleStoriesWithProjectID(id) {
  return $('#columns .story').filter(function () {
    return $('a.project-name', this).data('project-id') === id;
  }).length;
}

function visibleStoriesWithoutProjectID(id) {
  return $('#columns .story').filter(function () {
    return $('a.project-name', this).data('project-id') !== id;
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

function labelDisplayedAsActive(label) {
  return !$('#columns .column-labels .tag:contains("' + label + '")').closest('.row').hasClass('inactive');
}

function getLabelsString(elements) {
  var labels = []

  elements.each(function () {
    labels[labels.length] = $.trim($(this).text());
  });

  return labels.join(',');
}

beforeEach(function () {
  $.cookie('pivotalToken', 'abc123');

  TT.Mock.localStorage = {};

  spyOn(TT.Utils, 'localStorage').andCallFake(function (key, value) {
    if (value === null && TT.Mock.localStorage[key]) {
      delete TT.Mock.localStorage[key];
    } else if (value) {
      if (!TT.Utils.isString(value)) {
        value = JSON.stringify(value);
      }
      TT.Mock.localStorage[key] = value;
    }
    return TT.Mock.localStorage[key];
  });
  spyOn($, 'ajax').andCallFake(function (options) {
    options.success && options.success(TT.Mock.serverResponse(options.url, options.data));
    options.complete && options.complete();
  });
});

loadCSS();
