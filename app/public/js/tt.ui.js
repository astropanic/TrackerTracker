// Controller functions called by UI elements
// These are bound with data-click-handler attributes in the view.
// "this" is the clicked element

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
    if ($(this).hasClass('active')) {
      TT.Model.Layout.deactivate(name);
    } else {
      TT.Model.Layout.activate(name);
    }
    TT.refreshLayout();

    return false;
  };

  pub.removeColumn = function () {
    var name = $.trim($(this).closest('.column-title').text());
    $(this).closest('.column').empty().remove();
    TT.updateColumnDimensions();
    TT.Model.Layout.deactivate(name);
    TT.refreshLayout();

    return false;
  };

  pub.toggleStory = function () {
    $(this).siblings('.details').slideToggle(100);
    $(this).closest('.story').toggleClass('expanded-story');

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
    $.post('/token', { pivotalToken: pivotalToken }, TT.requestProjectsAndIterations);
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
    TT.addFilter({
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
    TT.addFilter({
      name: tag,
      fn: function (story) {
        return TT.Model.Story.hasTag(story, tag);
      }
    });
    TT.View.drawStories();

    return false;
  };

  pub.removeFilter = function () {
    var name = $.trim($(this).text());
    TT.Filters[name].active = false;
    $(this).addClass('inactive').unbind('click').click(function () {
      pub.reactivateFilter(name);
      return false;
    });
    TT.View.drawStories();

    return false;
  };

  pub.reactivateFilter = function (name) {
    TT.Filters[name].active = true;
    TT.Filters[name].element.removeClass('inactive').unbind('click').click(pub.removeFilter);
    TT.View.drawStories();

    return false;
  };

  return pub;

}());
