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

  pub.resetProjectList = function () {
    $('#projects .project.inactive').removeClass('inactive');
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
    } else {
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
    var name = $.trim($(this).text());
    var filter = TT.Model.Filter.get({ name: name });

    TT.Model.Filter.update({ name: filter.name }, { active: !filter.active });
    filter.element.toggleClass('inactive');
    TT.View.drawStories();

    return false;
  };

  pub.removeFilter = function () {
    var $filter = $(this).closest('.filter');
    var name = $.trim($filter.text());
    TT.Model.Filter.remove({ name: name });
    $filter.empty().remove();
    TT.View.drawStories();

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
