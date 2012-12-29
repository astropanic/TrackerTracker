var TT = TT || {};
TT.Init = (function () {

  var pub = {};

  // bootstrap functions

  pub.initColumns = function () {

    // Readymade columns
    // TODO: Allow creating & saving custom columns and layouts

    TT.Model.Column.add({
      name: 'Backlog',
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
        return { current_state: 'started' };
      }
    });

    TT.Model.Column.add({
      name: 'In QA',
      active: true,
      filter: function (story) {
        return story.current_state === 'finished' && !TT.Model.Story.hasTag(story, 'passedqa');
      },
      onDragIn: function (story) {
        return { current_state: 'finished', labels: TT.Model.Story.addTag(story, 'inqa').labels };
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
        return { current_state: 'finished', labels: TT.Model.Story.addTag(story, 'passedqa').labels };
      },
      onDragOut: function (story) {
        return { labels: TT.Model.Story.removeTag(story, 'passedqa').labels };
      }
    });

    TT.Model.Column.add({
      name: 'Delivered',
      active: true,
      filter: function (story) {
        return story.current_state === 'delivered';
      },
      onDragIn: function (story) {
        return { current_state: 'delivered' };
      }
    });

    TT.Model.Column.add({
      name: 'Accepted',
      active: true,
      filter: function (story) {
        return story.current_state === 'accepted';
      },
      onDragIn: function (story) {
        return { current_state: 'accepted' };
      }
    });

  };

  pub.initLayout = function () {
    var defaultLayout = [];
    TT.Model.Column.each(function (index, column) {
      defaultLayout[defaultLayout.length] = {
        name: column.name,
        active: column.active
      };
    });
    var savedLayout = TT.Model.Layout.load();

    TT.Model.Layout.replace(savedLayout ? JSON.parse(savedLayout) : defaultLayout);
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
      TT.API.addProjects(projects);
      TT.View.drawProjectList(projects);
      pub.setInactiveProjects();
      pub.requestAllIterations();
    }

    TT.Ajax.start();
    var projects = TT.Utils.localStorage('projects');

    if (projects) {
      useProjectData(projects);
    } else {
      $.get('/projects', function (projects) {
        TT.Utils.localStorage('projects', projects);
        useProjectData(projects);
      });
    }
  };

  pub.requestAllIterations = function () {
    TT.Model.Project.each(function (index, project) {
      TT.Ajax.start();
      $.get('/iterations', { project: project.id }, function (iterations) {
        iterations = JSON.parse(iterations).iteration;
        TT.API.addIterations(iterations);
        TT.Ajax.end();
        TT.View.drawStories();
      });
    });
    TT.View.updateColumnDimensions();
  };

  pub.onDomReady = function () {
    pub.initColumns();
    pub.initLayout();

    TT.View.drawColumns();
    TT.View.drawAccountNav();
    TT.View.drawColumnListNav();

    TT.View.updateColumnDimensions();
    $(window).resize(TT.View.updateColumnDimensions);

    TT.DragAndDrop.init();
    TT.Search.init();

    pub.requestProjectsAndIterations();
  };

  return pub;

}());

// bind init to jQuery on DOM Ready

if (TT.autoStart !== false) {
  $(TT.Init.onDomReady);
}
