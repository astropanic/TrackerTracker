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

  pub.drawColumns = function () {
    var html = '';
    $.each(TT.Layout, function (index, name) {
      html += pub.render('column', TT.Columns[name]);
    });
    return pub.attach(html, '#columns');
  };

  pub.drawProjectList = function (projects) {
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

    $.each(TT.Stories, function (index, story) {
      $.each(TT.Layout, function (index, name) {
        var column = TT.Columns[name];
        if (column.filter(story) && TT.projectIsActive(story.project_id) && TT.storyIsNotFiltered(story)) {
          var html = pub.render('story', story);
          pub.attach(html, '.' + column.class_name + ' .column-bucket');
        }
      });
    });
  };

  pub.setProjectActiveState = function () {
    $('#projects .project').each(function () {
      var id = $(this).data('project-id');
      TT.Projects[id].active = !$(this).hasClass('inactive');
    });
  };

  pub.drawStory = function (story) {
  };

  pub.drawFilter = function (filter) {
    var html = pub.render('filter', filter);
    return pub.attach(html, '#filters', 'prependTo');
  };

  pub.drawModalDialog = function (content) {
    var html = pub.render('modalDialog', { content: content });
    pub.dialog = pub.attach(html, 'body');
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

  return pub;

}());
