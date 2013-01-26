var TT = TT || {};
TT.Init = (function () {

  var pub = {};

  pub.firstRun = true;

  // bootstrap functions

  pub.preloadColumns = function () {

    // Readymade columns
    // TODO: Allow creating & saving custom columns and layouts

    TT.Model.Column.add({
      name: 'Labels',
      active: false,
      sortable: false,
      template: function () {
        var labels = TT.Utils.sortByProperty(TT.Model.Label.get(), 'name');
        return TT.View.render('epics', { labels: labels });
      },
      afterTemplateRender: function () {
        $('.epic').each(function () {
          var w = $(this).data('stories') + $(this).data('points');
          $(this).width(w);
        });
      }
    });

    TT.Model.Column.add({
      name: 'Icebox',
      active: false,
      sortable: false,
      template: function () {
        return TT.View.render('emptyIcebox');
      },
      filter: function (story) {
        return story.current_state === 'unscheduled';
      },
      onDragIn: function (story) {
        return { current_state: 'unscheduled' };
      },
      onDragOut: function (story) {
        return { current_state: 'unstarted' };
      }
    });

    TT.Model.Column.add({
      name: 'Unstarted',
      active: true,
      filter: function (story) {
        return story.current_state === 'unstarted';
      },
      onDragIn: function (story) {
        return { current_state: 'unstarted' };
      }
    });

    TT.Model.Column.add({
      name: 'Started',
      active: true,
      filter: function (story) {
        return story.current_state === 'started';
      },
      onDragIn: function (story) {
        return {
          current_state: 'started',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    TT.Model.Column.add({
      name: 'Finished',
      active: false,
      filter: function (story) {
        return story.current_state === 'finished';
      },
      onDragIn: function (story) {
        return {
          current_state: 'finished',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    TT.Model.Column.add({
      name: 'In QA',
      active: true,
      filter: function (story) {
        return story.current_state === 'finished' && !TT.Model.Story.hasTag(story, 'passedqa');
      },
      onDragIn: function (story) {
        return {
          current_state: 'finished',
          labels: TT.Model.Story.addTag(story, 'inqa').labels,
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      },
      onDragOut: function (story) {
        return { labels: TT.Model.Story.removeTag(story, 'inqa').labels };
      }
    });

    TT.Model.Column.add({
      name: 'Passed QA',
      active: true,
      filter: function (story) {
        return story.current_state === 'finished' && TT.Model.Story.hasTag(story, 'passedqa');
      },
      onDragIn: function (story) {
        return {
          current_state: 'finished',
          labels: TT.Model.Story.addTag(story, 'passedqa').labels,
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      },
      onDragOut: function (story) {
        return { labels: TT.Model.Story.removeTag(story, 'passedqa').labels };
      }
    });

    TT.Model.Column.add({
      name: 'Rejected',
      active: false,
      filter: function (story) {
        return story.current_state === 'rejected';
      },
      onDragIn: function (story) {
        return {
          current_state: 'rejected',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    TT.Model.Column.add({
      name: 'Delivered',
      active: true,
      filter: function (story) {
        return story.current_state === 'delivered';
      },
      onDragIn: function (story) {
        return {
          current_state: 'delivered',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    TT.Model.Column.add({
      name: 'Accepted',
      active: true,
      filter: function (story) {
        return story.current_state === 'accepted';
      },
      onDragIn: function (story) {
        return {
          current_state: 'accepted',
          owned_by: story.owned_by || TT.Utils.getUsername(),
          estimate: story.estimate || '0'
        };
      }
    });

    /*
    TT.Model.Column.add({
      name: 'Current',
      active: false,
      filter: function (story) {
        return story.current_iteration === true;
      }
    });

    TT.Model.Column.add({
      name: 'Backlog',
      active: false,
      filter: function (story) {
        return story.current_iteration === false;
      }
    });
    */

  };

  pub.preloadFilters = function () {
    var filters = TT.Model.Filter.clientLoad();

    if (filters) {
      pub.restoreFilters(filters);
    }

    if (TT.Model.Filter.isEmpty({ name: 'Owned by Me' })) {
      TT.Model.Filter.add({
        name: 'Owned by Me',
        type: 'user',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          return story.owned_by === $.cookie('pivotalUsername');
        }
      });
    }

    if (TT.Model.Filter.isEmpty({ name: 'Current Iteration' })) {
      TT.Model.Filter.add({
        name: 'Current Iteration',
        type: 'iteration',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          return story.current_iteration === true;
        }
      });
    }

    if (TT.Model.Filter.isEmpty({ name: 'Updated Recently' })) {
      TT.Model.Filter.add({
        name: 'Updated Recently',
        type: 'time',
        active: false,
        sticky: true,
        pure: true,
        fn: function (story) {
          var two_days = 1000 * 60 * 60 * 24 * 2;
          var updated = new Date(story.updated_at).getTime();
          return updated > (new Date().getTime() - two_days);
        }
      });
    }
  };

  pub.restoreFilters = function (filters) {
    $.each(JSON.parse(filters), function (index, filter) {
      if (filter.pure) {
        filter.fn = eval(filter.fn);
        TT.Model.Filter.add(filter);
      } else {
        if (filter.type === 'user') {
          filter.fn = function (story) {
            return story.owned_by === filter.name || story.requested_by === filter.name;
          };
          TT.Model.Filter.add(filter);
        } else if (filter.type === 'tag') {
          filter.fn = function (story) {
            return TT.Model.Story.hasTag(story, filter.name);
          };
          TT.Model.Filter.add(filter);
        } else if (filter.type === 'search') {
          filter.active = false;
          var terms = TT.Search.parseSearchQuery(filter.name);
          filter.fn = function (story) {
            if (terms.length === 0) {
              return true;
            }
            var text = JSON.stringify(story).toLowerCase();
            var match = true;
            $.each(terms, function (i, term) {
              if (text.indexOf(term) === -1) {
                match = false;
              }
            });

            return match;
          };
          TT.Model.Filter.add(filter);
          $('.filter[data-filter-id="' + filter.id + '"]').click(function () {
            TT.Search.requestMatchingStories(filter.name);
            $(this).unbind('click');
          });
        }
      }
    });
  };

  pub.setLayout = function () {
    var defaultLayout = [];
    TT.Model.Column.each(function (index, column) {
      defaultLayout[defaultLayout.length] = {
        name: column.name,
        active: column.active
      };
    });
    var savedLayout = TT.Model.Layout.clientLoad();

    if (savedLayout) {
      savedLayout = JSON.parse(savedLayout);
    }

    // reset when columns are updated
    if (savedLayout && savedLayout.length !== defaultLayout.length) {
      savedLayout = defaultLayout;
    }

    TT.Model.Layout.replace(savedLayout ? savedLayout : defaultLayout);

    TT.Model.Layout.each(function (index, column) {
      TT.Model.Column.update({ name: column.name }, { active: column.active });
    });
  };

  pub.setInactiveProjects = function () {
    var projectList = TT.Utils.localStorage('projectList');

    if (projectList) {
      $('#projects .project').addClass('inactive');
      $.each(JSON.parse(projectList), function (index, id) {
        $('#project-' + id).removeClass('inactive');
      });
    }
  };

  pub.requestProjectsAndIterations = function () {
    function useProjectData(projects) {
      projects = JSON.parse(projects).project;
      TT.Ajax.end();
      pub.addProjects(projects);
      TT.View.drawProjectList(projects);
      pub.setInactiveProjects();
      pub.requestAllIterations();
    }

    TT.Ajax.start();
    var projects = TT.Utils.localStorage('projects');

    if (projects) {
      useProjectData(projects);
    } else {
      $.ajax({
        url: '/projects',
        success: function (projects) {
          TT.Utils.localStorage('projects', projects);
          useProjectData(projects);
        }
      });
    }
  };

  pub.requestAllIterations = function () {
    TT.Model.Project.each(function (index, project) {
      TT.Ajax.start();
      $.ajax({
        url: '/iterations',
        data: { projectID: project.id },
        success: function (iterations) {
          iterations = JSON.parse(iterations).iteration;
          if (iterations) {
            pub.addIterations(iterations);
            TT.View.drawStories();
          } else {
            var note = 'Invalid response from the server. Did you enter the right token?';
            TT.View.message(note, 'error');
          }
          TT.Ajax.end();
        }
      });
    });
    TT.View.updateColumnDimensions();
  };

  pub.addProjects = function (projects) {
    $.each(TT.Utils.normalizePivotalArray(projects), function (index, project) {
      TT.Model.Project.overwrite(project);
      if (project.memberships && project.memberships.membership) {
        var memberships = TT.Utils.normalizePivotalArray(project.memberships.membership);
        $.each(memberships, function (index, membership) {
          TT.Model.User.overwrite(membership, 'name');
        });
      }
      if (project.labels) {
        $.each(project.labels.split(','), function (index, label) {
          TT.Model.Label.overwrite({ name: label }, 'name');
        });
      }
    });
  };

  pub.addIterations = function (iterations) {
    // This assumes first iteration is always current.
    var current_iteration = true;
    $.each(TT.Utils.normalizePivotalArray(iterations), function (index, iteration) {
      if (iteration.stories && iteration.stories.story) {
        var stories = TT.Utils.normalizePivotalArray(iteration.stories.story);
        $.each(stories, function (index, story) {
          story.current_iteration = current_iteration;
          TT.Model.Story.overwrite(story);
        });
      }
      current_iteration = false;
    });
  };

  pub.setUpdateInterval = function () {
    setInterval(function () {
      if ($.cookie('pivotalToken')) {
        pub.requestProjectsAndIterations();
      }
    }, 1000 * 60 * 5);
  };

  pub.init = function () {
    if (pub.firstRun) {
      TT.View.drawPageLayout();
    } else {
      $.each(TT.Model, function (index, model) {
        if (model.flush) {
          model.flush();
        }
      });
      $('#filters .filter').empty().remove();
      $('#projects .projects').empty().remove();
    }

    pub.preloadColumns();
    pub.preloadFilters();
    pub.setLayout();

    TT.View.drawColumns();
    TT.View.drawColumnListNav();
    TT.View.updateColumnDimensions();

    if (pub.firstRun) {
      $(window).resize(TT.View.updateColumnDimensions);
      TT.DragAndDrop.init();
      TT.Search.init();
      TT.UI.init();
      pub.setUpdateInterval();
    }

    if ($.cookie('pivotalToken')) {
      pub.requestProjectsAndIterations();
    } else {
      TT.View.drawAccountSettingsForm();
    }

    pub.firstRun = false;
  };

  return pub;

}());

// bind init to jQuery on DOM Ready

if (TT.autoStart !== false) {
  $(TT.Init.init);
}
