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
    var name = $.trim($(this).text());
    TT.Model.Layout.update({ name: name }, { active: !$(this).hasClass('active') });
    TT.View.refreshLayout();

    return false;
  };

  pub.removeColumn = function () {
    var name = $.trim($(this).closest('.column-title').text());
    $(this).closest('.column').empty().remove();
    TT.View.updateColumnDimensions();
    TT.Model.Layout.update({ name: name }, { active: false });
    TT.View.refreshLayout();

    return false;
  };

  pub.toggleStory = function () {
    var story = $(this).closest('.story').toggleClass('expanded-story');
    if (story.hasClass('expanded-story')) {
      var data = TT.Model.Story.get({ id: story.data('story-id') });
      var html = TT.View.render('storyDetails', data);
      var target = story.find('.container');
      TT.View.attach(html, target);
    } else {
      story.find('.details').empty().remove();
    }

    return false;
  };

  pub.requestToken = function () {
    TT.View.drawAccountSettingsForm();
  };

  pub.submitToken = function () {
    var pivotalToken = $('#token-input').val();
    if (!pivotalToken) {
      return false;
    }
    $.post('/token', { pivotalToken: pivotalToken }, TT.Init.requestProjectsAndIterations);
    TT.Dialog.close();

    return false;
  };

  pub.filterByProject = function () {
    var id = $(this).data('project-id');
    $('#projects .project input:checked').attr('checked', false);
    $('#project-' + id).click();
    TT.View.drawStories();

    return false;
  };

  pub.filterByUser = function () {
    var name = $(this).data('username');
    TT.Model.Filter.add({
      name: name,
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
      fn: function (story) {
        return TT.Model.Story.hasTag(story, tag);
      }
    });
    TT.View.drawStories();

    return false;
  };

  pub.deactivateFilter = function () {
    var name = $.trim($(this).text());
    TT.Model.Filter.update({ name: name }, { active: false });
    $(this).addClass('inactive').unbind('click').click(function () {
      pub.reactivateFilter(name);
      return false;
    });
    TT.View.drawStories();

    return false;
  };

  pub.reactivateFilter = function (name) {
    TT.Model.Filter.update({ name: name }, { active: true });
    TT.Model.Filter.get({ name: name }).element.removeClass('inactive')
      .unbind('click').click(pub.deactivateFilter);
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

  return pub;

}());
