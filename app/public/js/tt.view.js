// Functions related to rendering and attaching DOM elements

TT.View = (function () {

  var pub = {};

  var initClickHandlers = function (context) {
    $(context || 'body').find('[data-click-handler]').each(function () {
      // console.log('processing click handler', this);
      var handler = TT.Utils.strToFunction($(this).data('click-handler'));
      $(this).click(handler);
    }).removeAttr('data-click-handler');
  };

  // client-side templating is abstracted away
  pub.render = function (name, data) {
    if (!TT.Templates[name]) {
      TT.Templates[name] = new Hogan.Template(HoganTemplates[name]);
    }
    return TT.Templates[name].render(data);
  };

  pub.attach = function (html, target, method) {
    method = method || 'appendTo';
    var element = $(html)[method](target);
    if (html.indexOf('data-click-handler') !== -1) {
      initClickHandlers(element.parent());
    }
    return element;
  };

  pub.drawAccountNav = function () {
    return pub.attach(pub.render('accountNav'), '#logo');
  };

  pub.drawColumnListNav = function () {
    var html = pub.render('columnListNav', { columns: TT.Model.Layout.get() });
    pub.attach(html, '#columnList');
  };

  pub.drawColumns = function () {
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
    TT.updateColumnDimensions();
    pub.drawStories();
    TT.DragAndDrop.initStorySorting();
  };

  pub.drawProjectList = function (projects) {
    $('#projects .projects').empty().remove();
    var html = pub.render('projectList', { projects: projects });
    pub.attach(html, '#projects');
  };

  pub.clearStories = function () {
    $('.story').empty().remove();
  };

  pub.drawStories = function () {
    pub.setProjectActiveState();
    pub.clearStories();
    pub.showProjectResetButton();

    TT.Model.Story.each(function (index, story) {
      TT.Model.Layout.each(function (index, column) {
        column = TT.Model.Column.get({ name: column.name });
        if (column.filter(story) && TT.Model.Project.isActive({ id: story.project_id }) && TT.Model.Story.isNotFiltered(story)) {
          var html = pub.render('story', story);
          pub.attach(html, '.' + column.class_name + ' .column-bucket');
        }
      });
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

  pub.drawStory = function (story) {
  };

  pub.drawFilter = function (filter) {
    var html = pub.render('filter', filter);
    return pub.attach(html, '#filters', 'prependTo');
  };

  pub.drawModalDialog = function (content) {
    var html = pub.render('modalDialog', { content: content });
    TT.Dialog.dialog = pub.attach(html, 'body');
  };

  pub.drawAccountSettingsForm = function () {
    TT.Dialog.open(pub.render('accountSettings'));

    var pivotalToken = $.cookie('pivotalToken');
    if (pivotalToken) {
      $('#token-input').val(pivotalToken)
    }
  };

  pub.showProjectResetButton = function () {
    if ($('#projects .project.inactive').length > 0) {
      $('#project-reset').css('display', 'inline-block');
    } else {
      $('#project-reset').css('display', 'none');
    }
  };

  pub.message = function (str, type) {
    var html = pub.render('message', { type: type || 'info', str: str });
    return pub.attach(html, '#messages').click(function () {
      $(this).fadeOut(250).delay(300).remove();
      return false;
    }).hide().fadeIn(250).delay(10000).fadeOut(250).delay(300).remove();
  };

  return pub;

}());
