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
    if (story.hasClass('expanded-story')) {
      TT.View.drawStoryDetails(story);
      TT.Model.Story.update({ id: story.data('story-id') }, { expanded: true });
    } else {
      TT.Model.Story.update({ id: story.data('story-id') }, { expanded: false });
      story.find('.details').empty().remove();
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
    var id = $(this).closest('.story').data('story-id');
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
    var id = $(this).closest('.story').data('story-id');
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
        var update = { owned_by: $(this).data('value') };
        TT.Model.Story.update(story, update);
        TT.Model.Story.serverSave(story, update, TT.View.drawStories);
      }
    });

    return false;
  };

  pub.openStoryPointsUpdater = function () {
    var id = $(this).closest('.story').data('story-id');
    var story = TT.Model.Story.get({ id: id });
    var project = TT.Model.Project.get({ id: story.project_id });
    var items = [];

    $.each(project.point_scale.split(','), function (i, point) {
      items[items.length] = { name: point, value: point };
    });

    TT.Autocomplete.open({
      css: { width: 80 },
      items: items,
      value: $(this).text(),
      showInput: true,
      target: this,
      onApply: function () {
        var update = { estimate: $(this).data('value') };
        TT.Model.Story.update(story, update);
        TT.Model.Story.serverSave(story, update, TT.View.drawStories);
      }
    });

    return false;
  };

  pub.openStoryStateUpdater = function () {
    var id = $(this).closest('.story').data('story-id');
    var story = TT.Model.Story.get({ id: id });

    var items = [
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
    var id = $(this).closest('.story').data('story-id');
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
