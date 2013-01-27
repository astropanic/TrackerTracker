// Functions related to rendering and attaching DOM elements

var TT = TT || {};
TT.View = (function () {

  var pub = {};

  pub.MIN_COLUMN_WIDTH = 220;

  pub.Templates = {};

  // client-side templating is abstracted away
  pub.render = function (name, data) {
    if (!pub.Templates[name]) {
      pub.Templates[name] = new Hogan.Template(HoganTemplates[name]);
    }
    return pub.Templates[name].render(data);
  };

  pub.attach = function (html, target, method) {
    // Valid methods are appendTo, prependTo, insertAfter, insertBefore
    // since they return the new element, not the target
    method = method || 'appendTo';
    return $(html)[method](target);
  };

  pub.drawPageLayout = function () {
    return pub.attach(pub.render('layout'), 'body');
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
    var width_offset = 18;
    var width = Math.max(pub.MIN_COLUMN_WIDTH, Math.round(($window.width() - width_offset - (column_count * 8)) / column_count));
    $columns.width(width);

    $('#columns').width((width + 8) * column_count);
  };

  pub.drawColumnListNav = function () {
    $('#columnList .column-list-nav').empty().remove();
    var html = pub.render('columnListNav', { columns: TT.Model.Layout.get() });

    return pub.attach(html, '#columnList');
  };

  pub.drawColumns = function () {
    $('#columns .column').remove();
    TT.Model.Layout.each(function (index, column) {
      if (column.active) {
        pub.drawColumn(column.name);
      }
    });
  };

  pub.drawColumn = function (name) {
    $('#columns .column[data-name="' + name + '"]').remove();
    var column = TT.Model.Column.get({ name: name });
    var html = pub.render('column', column);
    var element = pub.attachColumn(column, html);
    pub.drawColumnTemplate(column);

    return element;
  };

  pub.attachColumn = function (column, html) {
    var activeColumns = TT.Model.Layout.find({ active: true });
    if (activeColumns[0].name === column.name) {
      return pub.attach(html, '#columns', 'prependTo');
    }

    var precedingColumn;
    $.each(activeColumns, function (index, activeColumn) {
      if (activeColumn.name === column.name) {
        precedingColumn = $('#columns .column[data-name="' + activeColumns[index - 1].name + '"]')[0];
      }
    });
    if (precedingColumn) {
      return pub.attach(html, precedingColumn, 'insertAfter');
    }

    return pub.attach(html, '#columns');
  };

  pub.addColumn = function (name) {
    TT.Model.Column.update({ name: name }, { active: true });
    TT.Model.Layout.update({ name: name }, { active: true });
    TT.Model.Layout.clientSave();
    pub.drawColumn(name);
    pub.drawStoriesInColumn(TT.Model.Column.get({ name: name }));
    pub.updateColumnDimensions();
    pub.drawColumnListNav();
    TT.DragAndDrop.initStorySorting();
    pub.refreshColumnStoryCount();
    // pub.refreshLayout();
  };

  pub.removeColumn = function (name) {
    $('#columns .column[data-name="' + name + '"]').remove();
    TT.Model.Column.update({ name: name }, { active: false });
    TT.Model.Layout.update({ name: name }, { active: false });
    TT.Model.Layout.clientSave();
    pub.updateColumnDimensions();
    pub.drawColumnListNav();
    pub.refreshColumnStoryCount();
  };

  pub.drawColumnTemplates = function () {
    $('#columns .column-template').remove();
    TT.Model.Layout.each(function (index, column) {
      if (column.active) {
        var actualColumn = TT.Model.Column.get({ name: column.name });
        pub.drawColumnTemplate(actualColumn);
      }
    });
  };

  pub.drawColumnTemplate = function (column) {
    if (column.template) {
      var html = '<div class="column-template">' + column.template() + '</div>';
      var element = pub.attach(html, '#columns .' + column.class_name + ' .column-bucket');

      if (column.afterTemplateRender) {
        column.afterTemplateRender();
      }

      return element;
    }
  };

  pub.refreshColumns = function () {
    $('#columns .column').empty().remove();
    pub.drawColumns();
    pub.updateColumnDimensions();
    pub.drawStories();
    TT.DragAndDrop.initStorySorting();
  };

  pub.refreshColumnStoryCount = function () {
    TT.Model.Column.each(function (index, column) {
      var $counter = $('#columnList .column-selector:contains("' + column.name + '") span.column-story-count');
      if (column.storyCount === 0) {
        $counter.hide();
      } else {
        $counter.show().html(column.storyCount);
      }
    });
  };

  pub.refreshLayout = function () {
    $('.column-list-nav').empty().remove();
    pub.drawColumnListNav();
    TT.Model.Layout.clientSave();
    pub.refreshColumns();
  };

  pub.drawProjectList = function (projects) {
    $('#projects .projects').empty().remove();
    var html = pub.render('projectList', { projects: projects });

    return pub.attach(html, '#projects');
  };

  pub.clearStories = function () {
    $('.story').empty().remove();
  };

  pub.drawStories = function () {
    pub.setProjectActiveState();
    pub.clearStories();

    TT.Model.Column.each(function (index, column) {
      pub.drawStoriesInColumn(column);
    });

    pub.refreshColumnStoryCount();
    pub.drawColumnTemplates();
  };

  pub.drawStoriesInColumn = function (column) {
    column.storyCount = 0;
    TT.Model.Story.each(function (index, story) {
      if (column.filter && column.filter(story) &&
        TT.Model.Project.isActive({ id: story.project_id }) &&
        TT.Model.Story.isNotFiltered(story)) {
        column.storyCount++;
        if (column.active) {
          pub.drawStory(story, column);
        }
      }
    });
  };

  pub.setProjectActiveState = function () {
    var projectList = [];
    $('#projects .project').each(function () {
      var id = $(this).data('project-id');
      var isActive = !$(this).hasClass('inactive');
      TT.Model.Project.update({ id: id }, { active: isActive });
      if (isActive) {
        projectList.push(id);
      }
    });

    TT.Utils.localStorage('projectList', projectList);
  };

  pub.restoreStoryState = function (element, story) {
    if (story.expanded) {
      element.toggleClass('expanded-story');
      pub.drawStoryDetails(element);
    }

    var state = TT.Utils.getStoryState(story.id);
    // TODO: clean this up
    if (state.description) {
      element.find('.description').click();
      element.find('.description-container textarea').val(state.description).height(state.descriptionHeight).focus();
    }
    if (state.note) {
      element.find('.add-note').click();
      element.find('.notes textarea').val(state.note).height(state.noteHeight).focus();
    }
    if (state.name) {
      element.find('.title').click();
      element.find('.title-container textarea').val(state.name).height(state.nameHeight).focus();
    }
  };

  pub.drawStory = function (story, column) {
    var html = pub.render('story', story);
    var element = pub.attach(html, '.' + column.class_name + ' .column-bucket');

    pub.restoreStoryState(element, story);
    return element;
  };

  pub.redrawStory = function (story) {
    $('#columns .story-' + story.id).each(function () {
      var html = pub.render('story', story);
      var element = pub.attach(html, this, 'insertAfter');

      pub.restoreStoryState(element, story);
      $(this).remove();
    });
  };

  pub.drawStoryDetails = function (story) {
    var data = TT.Model.Story.get({ id: story.data('id') });
    var html = TT.View.render('storyDetails', data);

    return pub.attach(html, story);
  };

  pub.drawFilter = function (filter) {
    var html = pub.render('filter', filter);
    var element = pub.attach(html, '#filters', 'prependTo');
    if (filter.active === false) {
      element.addClass('inactive');
    }

    return element;
  };

  pub.drawModalDialog = function (content) {
    var html = pub.render('modalDialog', { content: content });
    return pub.attach(html, 'body');
  };

  pub.drawResetDialog = function () {
    TT.Dialog.open(pub.render('resetDialog'));
  };

  pub.drawAccountSettingsForm = function () {
    TT.Dialog.open(pub.render('accountSettings'));

    var id;
    $('#pivotal-token-input').val($.cookie('pivotalToken')).focus().bind('keyup paste', function () {
      var me = this;
      clearTimeout(id);
      id = setTimeout(function () {
        var token = $.trim($(me).val());
        if (token && token !== TT.Utils.getToken()) {
          $(me).addClass('updating');
          $.cookie('pivotalToken', token, { expires: 365 });
          $.ajax({
            url: '/projects',
            success: function (projects) {
              $(me).removeClass('updating');
              var parsedProjects = JSON.parse(projects);
              if (parsedProjects) {
                $(me).addClass('valid').removeClass('invalid');
                TT.Utils.localStorage('projects', projects);
                TT.Init.addProjects(parsedProjects.project);
              } else {
                $(me).addClass('invalid').removeClass('valid');
              }
            }
          });
        }
      }, 100);
    });

    $('#pivotal-username').val($.cookie('pivotalUsername'));
    $('#pivotal-username').focus(TT.UI.openPivotalUsernameAutocomplete);
  };

  pub.message = function (str, type) {
    var html = pub.render('message', { str: str, type: type || 'info' });
    var element = pub.attach(html, '#messages').click(function () {
      $(this).fadeOut(250, function () { $(this).remove(); });
      return false;
    });

    setTimeout(function () {
      element.fadeOut(1000, function () { element.remove(); });
    }, 3000);
  };

  return pub;

}());
