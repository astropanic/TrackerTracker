// Controller functions called by UI elements
// These are bound with data-click-handler attributes in the view.
// "this" is the clicked element

var TT = TT || {};
TT.UI = (function () {

  var pub = {};

  pub.selectProject = function () {
    $(this).toggleClass('inactive');
    TT.View.drawStories();

    return false;
  };

  pub.refreshProjects = function () {
    TT.Utils.localStorage('projects', null);
    TT.Init.requestProjectsAndIterations();

    return false;
  };

  pub.toggleColumnSelector = function () {
    var name = $.trim($(this).closest('.column-selector').find('.column-name').text());
    TT.Model.Column.update({ name: name }, { active: !$(this).hasClass('active') });
    TT.Model.Layout.update({ name: name }, { active: !$(this).hasClass('active') });
    TT.View.refreshLayout();

    return false;
  };

  pub.removeColumn = function () {
    var name = $.trim($(this).closest('.column-title').text());
    $(this).closest('.column').empty().remove();
    TT.Model.Layout.update({ name: name }, { active: false });
    TT.View.updateColumnDimensions();
    TT.View.drawColumnListNav();
    TT.View.refreshColumnStoryCount();

    return false;
  };

  pub.toggleStory = function () {
    var story = $(this).closest('.story').toggleClass('expanded-story');
    var id = story.data('id');

    if (story.hasClass('expanded-story')) {
      TT.View.drawStoryDetails(story);
      TT.Model.Story.update({ id: story.data('id') }, { expanded: true });
    } else {
      TT.Model.Story.update({ id: story.data('id') }, { expanded: false });
      story.find('.details').empty().remove();
      TT.Utils.updateStoryState(id, { description: null, descriptionHeight: null, note: null, noteHeight: null });
    }

    return false;
  };

  pub.filterByProject = function () {
    var id = $(this).data('project-id');
    $('#projects .project').addClass('inactive');
    $('#project-' + id).removeClass('inactive');
    TT.View.drawStories();

    return false;
  };

  pub.filterByUser = function () {
    var name = $(this).data('username');
    TT.Model.Filter.add({
      name: name,
      type: 'user',
      fn: function (story) {
        return story.owned_by === name || story.requested_by === name;
      }
    });
    TT.View.drawStories();

    return false;
  };

  pub.filterByTag = function () {
    var tag = $.trim($(this).text());
    TT.Model.Filter.add({
      name: tag,
      type: 'tag',
      fn: function (story) {
        return TT.Model.Story.hasTag(story, tag);
      }
    });
    TT.View.drawStories();

    return false;
  };

  pub.toggleFilter = function () {
    var id = $(this).closest('.filter').data('filter-id');
    var filter = TT.Model.Filter.get({ id: id });

    TT.Model.Filter.update({ id: id }, { active: !filter.active });
    $(this).toggleClass('inactive');
    TT.View.drawStories();
    TT.Model.Filter.clientSave();

    return false;
  };

  pub.removeFilter = function () {
    var $filter = $(this).closest('.filter');
    var id = $filter.data('filter-id');
    TT.Model.Filter.remove({ id: id });
    $filter.empty().remove();
    TT.View.drawStories();
    TT.Model.Filter.clientSave();

    return false;
  };

  pub.openAccountSettings = function () {
    TT.View.drawAccountSettingsForm();

    return false;
  };

  pub.saveAccountSettings = function () {
    var pivotalToken = $('#pivotal-token-input').val();
    var pivotalUsername = $('#pivotal-username').val();

    if (!pivotalToken) {
      // TODO: client-side validation
      return false;
    }

    $.cookie('pivotalToken', pivotalToken, { expires: 365 });
    $.cookie('pivotalUsername', pivotalUsername, { expires: 365 });

    TT.Dialog.close();
    TT.Init.init();

    return false;
  };

  pub.openPivotalUsernameAutocomplete = function () {
    var items = [];

    TT.Model.User.each(function (index, user) {
      items[items.length] = {
        name: '<strong>' + user.name + '</strong> (' + user.initials + ')',
        value: user.name
      };
    });

    TT.Autocomplete.open({ items: items, target: this });

    return false;
  };

  // TODO: DRY these up

  pub.openStoryRequesterUpdater = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });
    var project = TT.Model.Project.get({ id: story.project_id });
    var users = TT.Utils.normalizePivotalArray(project.memberships.membership);
    var items = [];

    $.each(users, function (i, user) {
      items[items.length] = { name: user.person.name, value: user.person.name };
    });

    TT.Autocomplete.open({
      css: { width: 200 },
      items: items,
      value: $(this).text(),
      showInput: true,
      target: this,
      onApply: function () {
        var update = { requested_by: $(this).data('value') };
        TT.Model.Story.update(story, update);
        TT.Model.Story.serverSave(story, update, TT.View.drawStories);
      }
    });

    return false;
  };

  pub.openStoryOwnerUpdater = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });
    var project = TT.Model.Project.get({ id: story.project_id });
    var users = TT.Utils.normalizePivotalArray(project.memberships.membership);
    var items = [];

    if (story.current_state === 'unscheduled' || story.current_state === 'unstarted') {
      items[items.length] = { name: '<em>none</em>', value: '' };
    }

    $.each(users, function (i, user) {
      items[items.length] = { name: user.person.name, value: user.person.name };
    });

    TT.Autocomplete.open({
      css: { width: 200 },
      items: items,
      value: $(this).text(),
      showInput: true,
      target: this,
      onApply: function () {
        var update = { owned_by: $(this).data('value') };
        TT.Model.Story.update(story, update);
        TT.Model.Story.serverSave(story, update, TT.View.drawStories);
      }
    });

    return false;
  };

  pub.openStoryPointsUpdater = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });
    var project = TT.Model.Project.get({ id: story.project_id });
    var items = [];

    if (story.current_state === 'unscheduled' || story.current_state === 'unstarted') {
      items[items.length] = { name: '<em>unestimated</em>', value: '-1' };
    }

    $.each(project.point_scale.split(','), function (i, point) {
      items[items.length] = { name: point, value: point };
    });

    TT.Autocomplete.open({
      css: { width: 90 },
      items: items,
      value: $(this).text(),
      showInput: true,
      target: this,
      onApply: function () {
        var update = { estimate: $(this).data('value') };
        TT.Model.Story.serverSave(story, update, TT.View.drawStories);
        if (update.estimate < 0) {
          update.estimate = '';
        }
        TT.Model.Story.update(story, update);
      }
    });

    return false;
  };

  pub.openStoryStateUpdater = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });

    var items = [
      { name: 'Unscheduled', value: 'unscheduled' },
      { name: 'Unstarted', value: 'unstarted' },
      { name: 'Started', value: 'started' },
      { name: 'Finished', value: 'finished' },
      { name: 'Delivered', value: 'delivered' },
      { name: 'Accepted', value: 'accepted' },
      { name: 'Rejected', value: 'rejected' }
    ];

    TT.Autocomplete.open({
      css: { width: 120 },
      items: items,
      value: $(this).text(),
      showInput: true,
      target: this,
      onApply: function () {
        var update = { current_state: $(this).data('value') };
        TT.Model.Story.update(story, update);
        TT.Model.Story.serverSave(story, update, TT.View.drawStories);
      }
    });

    return false;
  };

  pub.openStoryTypeUpdater = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });

    var items = [
      { name: 'Feature', value: 'feature' },
      { name: 'Bug', value: 'bug' },
      { name: 'Chore', value: 'chore' },
      { name: 'Release', value: 'release' }
    ];

    TT.Autocomplete.open({
      css: { width: 120 },
      items: items,
      value: $(this).text(),
      showInput: true,
      target: this,
      onApply: function () {
        var update = { story_type: $(this).data('value') };
        TT.Model.Story.update(story, update);
        TT.Model.Story.serverSave(story, update, TT.View.drawStories);
      }
    });

    return false;
  };

  pub.openStoryAttachmentControls = function () {
    var id = $(this).data('id');
    var url = $(this).data('url');

    var actions = [
      { name: 'Download', value: 'Download' },
      { name: 'Delete', value: 'Delete' }
    ];

    TT.Autocomplete.open({
      css: { width: 80 },
      items: actions,
      target: this,
      noActive: true,
      onApply: function () {
        var action = $(this).data('value');
        if (action === 'Download') {
          document.location = url;
        } else if (action === 'Delete') {
          // TODO: delete attachment
        }
      }
    });

    return false;
  };

  pub.editStoryTags = function () {
    return false;
  };

  pub.editStoryDescription = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });

    story.isBeingEdited = true;

    var html = TT.View.render('textarea', {
      text: story.description,
      onSave: 'TT.UI.saveStoryDescription',
      onCancel: 'TT.UI.cancelEditDescription'
    });

    var textarea = TT.View.attach(html, this, 'insertAfter').find('textarea');
    textarea.focus().autosize().bind('keyup blur', function () {
      TT.Utils.updateStoryState(story.id, {
        description: textarea.val(),
        descriptionHeight: textarea.height()
      });
    });

    $(this).hide();
    return false;
  };

  pub.saveStoryDescription = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });

    var description = $(this).closest('.textarea').find('textarea').val();
    var formatted_description = description ? TT.Utils.showdownLite(description) : 'Click to add a description';

    TT.Model.Story.update({ id: id }, {
      description: description,
      formatted_description: formatted_description
    });

    TT.Utils.updateStoryState(id, { description: null, descriptionHeight: null });

    $(this).closest('.story').find('.description').html(formatted_description).show();
    $(this).closest('.textarea').remove();

    TT.Model.Story.serverSave(story, { description: description });

    return false;
  };

  pub.cancelEditDescription = function () {
    var id = $(this).closest('.story').data('id');
    TT.Utils.updateStoryState(id, { description: null, descriptionHeight: null });

    $(this).closest('.story').find('.description').show();
    $(this).closest('.textarea').remove();

    return false;
  };

  pub.addStoryNote = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });

    var html = TT.View.render('textarea', {
      onSave: 'TT.UI.saveStoryNote',
      onCancel: 'TT.UI.cancelStoryNote'
    });

    var textarea = TT.View.attach(html, this, 'insertAfter').find('textarea');
    textarea.focus().autosize().bind('keyup blur', function () {
      TT.Utils.updateStoryState(story.id, {
        note: textarea.val(),
        noteHeight: textarea.height()
      });
    });

    $(this).hide();
    return false;
  };

  pub.saveStoryNote = function () {
    var id = $(this).closest('.story').data('id');
    var story = TT.Model.Story.get({ id: id });

    var comment = $(this).closest('.textarea').find('textarea').val();
    var author = $.cookie('pivotalUsername');

    if (!comment || !author) {
      return false;
    }

    story.notes.unshift({
      timestamp: new Date().getTime(),
      text: comment,
      author: author,
      noted_at: new Date() + '',
      isImage: false
    });

    TT.Model.Story.update({ id: id }, { notes: story.notes });

    $(this).closest('.story').find('.add-note').show();
    $(this).closest('.textarea').remove();

    TT.Ajax.start();
    $.ajax({
      url: '/addStoryComment',
      type: 'POST',
      data: {
        projectID: story.project_id,
        storyID: story.id,
        comment: comment
      },
      complete: function () {
        TT.Ajax.end();
        TT.View.redrawStory(story);
      }
    });

    TT.Utils.updateStoryState(id, { note: null, noteHeight: null });

    return false;
  };

  pub.cancelStoryNote = function () {
    var id = $(this).closest('.story').data('id');
    TT.Utils.updateStoryState(id, { note: null, noteHeight: null });

    $(this).closest('.story').find('.add-note').show();
    $(this).closest('.textarea').remove();

    return false;
  };

  pub.deleteStoryNote = function () {
    return false;
  };

  pub.loadIcebox = function () {
    $(this).closest('.column-note').remove();

    var column = TT.Model.Column.get({ name: 'Icebox' });
    column.sortable = true;
    column.template = null;

    TT.Search.requestMatchingStories('state:unscheduled');

    return false;
  };

  pub.init = function () {
    $('body').click(function (e) {
      var target = $(e.target).closest('[data-click-handler]');
      var handler = target.data('click-handler');
      if (handler) {
        handler = TT.Utils.strToFunction(handler);
        if (TT.Utils.isFunction(handler)) {
          return handler.apply(target[0]);
        }
      }
    });
  };

  return pub;

}());
