// Functions related to rendering and attaching DOM elements

var TT = TT || {};
TT.View = (function () {

  var pub = {};

  pub.MIN_COLUMN_WIDTH = 280;

  pub.Templates = {};

  // client-side templating is abstracted away
  pub.render = function (name, data) {
    if (!pub.Templates[name]) {
      pub.Templates[name] = new Hogan.Template(HoganTemplates[name]);
    }
    return pub.Templates[name].render(data);
  };

  pub.attach = function (html, target, method) {
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
    $('#columns .column').empty().remove();
    var html = '';
    TT.Model.Layout.each(function (index, column) {
      if (column.active) {
        html += pub.render('column', TT.Model.Column.get({ name: column.name }));
      }
    });

    return pub.attach(html, '#columns');
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
      $('#columnList .column-selector:contains("' + column.name + '") span.column-story-count').html(column.storyCount);
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
      column.storyCount = 0;
    });

    TT.Model.Story.each(function (index, story) {
      TT.Model.Column.each(function (index, column) {
        if (column.filter(story) && TT.Model.Project.isActive({ id: story.project_id }) && TT.Model.Story.isNotFiltered(story)) {
          column.storyCount++;
          if (column.active) {
            pub.drawStory(story, column);
          }
        }
      });
    });

    pub.refreshColumnStoryCount();
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

  pub.drawStory = function (story, column) {
    var html = pub.render('story', story);
    var element = pub.attach(html, '.' + column.class_name + ' .column-bucket');

    if (story.expanded) {
      element.toggleClass('expanded-story');
      pub.drawStoryDetails(element);
    }

    var temporaryDescription = TT.UI.getTemporaryDescription(story.id);
    if (temporaryDescription.text) {
      element.find('.description').click();
      element.find('textarea').val(temporaryDescription.text).focus().height(temporaryDescription.height);
    }

    return element;
  };

  pub.redrawStory = function (story) {
    $('#columns .story-' + story.id).each(function () {
      var html = pub.render('story', story);
      var element = pub.attach(html, this, 'insertAfter');

      if (story.expanded) {
        element.toggleClass('expanded-story');
        pub.drawStoryDetails(element);
      }

      $(this).remove();
    });
  };

  pub.drawStoryDetails = function (story) {
    var data = TT.Model.Story.get({ id: story.data('id') });
    var html = TT.View.render('storyDetails', data);
    var target = story.find('.container');

    return pub.attach(html, target);
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

  pub.drawAccountSettingsForm = function () {
    TT.Dialog.open(pub.render('accountSettings'));

    $('#pivotal-token-input').val($.cookie('pivotalToken')).focus();
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
      element.fadeOut(250, function () { element.remove(); });
    }, 6000);
  };

  return pub;

}());
