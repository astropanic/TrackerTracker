var TT = (function () {

  var pub = {};

  pub.Templates = {};
  pub.Columns = [];
  pub.Filters = {};
  pub.Layout = {};
  pub.Projects = {};
  pub.Stories = {};
  pub.Users = {};

  pub.noop = function () {};

  // TODO: move all of this to tt.model.js / standardized model structure

  // client-side data transformation

  pub.addUser = function (user) {
    pub.Users[user.id] = {
      id: user.id,
      initials: user.person.initials,
      name: user.person.name
    };
  };

  pub.addStory = function (story) {
    story.name = TT.Utils.showdownLite(story.name);
    story.description = story.description.length ? TT.Utils.showdownLite(story.description) : '';
    story.estimate = story.estimate >= 0 ? story.estimate : '';
    story.initials = TT.Utils.usernameToInitials(story.owned_by);
    story.project_name = TT.Utils.generateInitials(pub.getProjectNameFromID(story.project_id));
    story.project_classname = TT.Utils.cssify(pub.getProjectNameFromID(story.project_id));
    story.labels = story.labels ? story.labels.indexOf(',') !== -1 ? story.labels.split(',') : [story.labels] : [];
    if (story.notes && story.notes.note) {
      story.notes = story.notes.note;
    }
    pub.Stories[story.id] = story;
  };

  pub.addProject = function (project) {
    project.active = true;
    pub.Projects[project.id] = project;
  };

  pub.addColumn = function (column) {
    column.class_name = 'column-' + TT.Utils.cssify(column.name);
    pub.Columns[pub.Columns.length] = column;
  };

  pub.getColumn = function (properties) {
    return TT.Model.search(pub.Columns, properties)[0];
  };

  pub.addFilter = function (filter) {
    if (!pub.Filters[filter.name]) {
      filter.element = TT.View.drawFilter(filter);
      filter.active = true;
      pub.Filters[filter.name] = filter;
    } else if (pub.Filters[filter.name].active === false) {
      TT.UI.reactivateFilter(filter.name);
    }
  };

  // helpers

  pub.getProjectNameFromID = function (id) {
    return pub.Projects[id].name;
  };

  pub.projectIsActive = function (project_id) {
    return !!pub.Projects[project_id].active;
  };

  pub.storyIsNotFiltered = function (story) {
    var result = true;
    $.each(pub.Filters, function (index, filter) {
      if (result && filter.active && !filter.fn(story)) {
        result = false;
      }
    });

    return result;
  };

  pub.hasTag = function (story, tag) {
    if (story.labels && tag) {
      return $.inArray(tag, story.labels) !== -1;
    }
    return false;
  };

  pub.addTag = function (tags, tag) {
    if ($.inArray(tag, tags) === -1) {
      tags[tags.length] = tag;
    }
    return tags;
  };

  pub.removeTag = function (tags, tag) {
    return TT.Utils.removeFromArray(tags, tag);
  };

  // bootstrap functions

  pub.initLayout = function () {
    var defaultLayout = [];
    $.each(TT.Columns, function (index, column) {
      defaultLayout[defaultLayout.length] = {
        name: column.name,
        active: column.active
      };
    });
    var savedLayout = TT.Model.Layout.load();

    pub.Layout = savedLayout ? JSON.parse(savedLayout) : defaultLayout;
  };

  pub.refreshLayout = function () {
    $('.column-list-nav').empty().remove();
    TT.View.drawColumnListNav();

    TT.Model.Layout.save();
    TT.View.refreshColumns();
  };

  pub.layoutSortUpdate = function (element) {
    var name = element.data('column-name');

    var oldIndex = TT.Model.Layout.index({ name: name });
    var column = TT.Model.Layout.first({ name: name });
    var offset = column.indexStop - column.indexStart;
    var newIndex = oldIndex + offset;

    TT.Layout = TT.Utils.arrayMove(TT.Layout, oldIndex, newIndex);
  };

  pub.updateColumnDimensions = function () {
    var $window = $(window);
    var $columns = $('#columns .column');

    if ($columns.length === 0) {
      $('#columns').width('90%');

      return false;
    }

    var height_offset = 26;
    var height = $window.height() - ($('.column-bucket').offset().top + height_offset);
    $('.column-bucket').height(height);

    var column_count = $columns.length;
    var width_offset = 14;
    var width = Math.max(200, Math.round(($window.width() - width_offset - (column_count * 8)) / column_count));
    $columns.width(width);

    $('#columns').width((width + 8) * column_count);
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
    $.each(pub.Projects, function (index, project) {
      TT.Ajax.start();
      $.get('/iterations', { project: project.id }, function (iterations) {
        iterations = JSON.parse(iterations).iteration;
        TT.API.addIterations(iterations);
        TT.Ajax.end();
        TT.View.drawStories();
      });
    });
    pub.updateColumnDimensions();
  };

  pub.onDomReady = function () {
    pub.initLayout();

    pub.View.drawColumns();
    pub.View.drawAccountNav();
    pub.View.drawColumnListNav();

    pub.updateColumnDimensions();
    $(window).resize(pub.updateColumnDimensions);

    TT.DragAndDrop.init();
    TT.Search.init();

    pub.requestProjectsAndIterations();
  };

  return pub;

}());
