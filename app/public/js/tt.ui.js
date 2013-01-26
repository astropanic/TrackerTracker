// Controller functions called by UI elements
// These are bound with data-click-handler attributes in the view.
// "this" is the clicked element

var TT = TT || {};
TT.UI = (function () {

  var pub = {};

  function getStoryFromContext(context) {
    var id = $(context).closest('.story').data('id');
    return TT.Model.Story.get({ id: id });
  }

  pub.openResetDialog = function () {
    TT.View.drawResetDialog();

    return false;
  };

  pub.reset = function () {
    TT.Dialog.close();
    TT.Utils.clearLocalStorage();
    $.cookie('pivotalToken', null);
    $.cookie('pivotalUsername', null);
    TT.Init.init();

    return false;
  };

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
    TT.Model.Layout.clientSave();
    TT.View.updateColumnDimensions();
    TT.View.drawColumnListNav();
    TT.View.refreshColumnStoryCount();

    return false;
  };

  pub.removeColumnOnMiddleClick = function (e) {
    if (TT.Utils.keyPressed(e, 'MIDDLE_CLICK')) {
      $(this).find('span').click();
      return false;
    }

    // intentionally not returning false here to continue event bubbling
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
      // TODO: Clean this up
      TT.Utils.updateStoryState(id, {
        name: null,
        nameHeight: null,
        description: null,
        descriptionHeight: null,
        note: null,
        noteHeight: null
      });
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

  pub.toggleFilter = function (e) {
    var id = $(this).closest('.filter').data('filter-id');
    var filter = TT.Model.Filter.get({ id: id });

    if (TT.Utils.keyPressed(e, 'MIDDLE_CLICK') && filter.sticky !== true) {
      $(this).find('span.close').click();
      return false;
    }

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
      TT.View.message('Token is required.', 'error');
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

  pub.openStoryRequesterUpdater = function () {
    var getItems = function (story) {
      var project = TT.Model.Project.get({ id: story.project_id });
      var users = TT.Utils.normalizePivotalArray(project.memberships.membership);
      var items = [];

      $.each(users, function (i, user) {
        items[items.length] = { name: user.person.name, value: user.person.name };
      });

      return items;
    };

    return openStoryUpdater(this, { getItems: getItems, key: 'requested_by' });
  };

  pub.openStoryOwnerUpdater = function () {
    var getItems = function (story) {
      var project = TT.Model.Project.get({ id: story.project_id });
      var users = TT.Utils.normalizePivotalArray(project.memberships.membership);
      var items = [];

      if (story.current_state === 'unscheduled' || story.current_state === 'unstarted') {
        items[items.length] = { name: '<em>none</em>', value: '' };
      }

      $.each(users, function (i, user) {
        items[items.length] = { name: user.person.name, value: user.person.name };
      });

      return items;
    };

    return openStoryUpdater(this, { getItems: getItems, key: 'owned_by' });
  };

  pub.openStoryPointsUpdater = function () {
    var getItems = function (story) {
      var project = TT.Model.Project.get({ id: story.project_id });
      var items = [];

      if (story.current_state === 'unscheduled' || story.current_state === 'unstarted') {
        items[items.length] = { name: '<em>unestimated</em>', value: '-1' };
      }

      $.each(project.point_scale.split(','), function (i, point) {
        items[items.length] = { name: point, value: point };
      });

      return items;
    };

    var onBeforeUpdate = function (update) {
      if (update.estimate < 0) {
        update.estimate = '';
      }

      return update;
    };

    return openStoryUpdater(this, {
      getItems: getItems,
      key: 'estimate',
      width: 100,
      onBeforeUpdate: onBeforeUpdate
    });
  };

  pub.openStoryStateUpdater = function () {
    var getItems = function (story) {
      return [
        { name: 'Unscheduled', value: 'unscheduled' },
        { name: 'Unstarted', value: 'unstarted' },
        { name: 'Started', value: 'started' },
        { name: 'Finished', value: 'finished' },
        { name: 'Delivered', value: 'delivered' },
        { name: 'Accepted', value: 'accepted' },
        { name: 'Rejected', value: 'rejected' }
      ];
    };

    return openStoryUpdater(this, {
      getItems: getItems,
      key: 'current_state',
      width: 120
    });
  };

  pub.openStoryTypeUpdater = function () {
    var getItems = function (story) {
      return [
        { name: 'Feature', value: 'feature' },
        { name: 'Bug', value: 'bug' },
        { name: 'Chore', value: 'chore' },
        { name: 'Release', value: 'release' }
      ];
    };

    return openStoryUpdater(this, {
      getItems: getItems,
      key: 'story_type',
      width: 120
    });
  };

  function openStoryUpdater(context, options) {
    var story = getStoryFromContext(context);

    TT.Autocomplete.open({
      css: { width: options.width || 200 },
      items: options.getItems(story),
      value: $(context).text(),
      showInput: true,
      target: context,
      onApply: function () {
        var update = {};
        update[options.key] = $(this).data('value');
        TT.Model.Story.serverSave(story, update, TT.View.drawStories);
        if (options.onBeforeUpdate) {
          update = options.onBeforeUpdate(update);
        }
        TT.Model.Story.update(story, update);
      }
    });

    return false;
  }

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

  pub.removeTagFromStory = function () {
    var story = getStoryFromContext(this);
    var label = $.trim($(this).closest('.tag').text());
    TT.Model.Label.removeStory(label, story.id);
    TT.Model.Label.recalculateTotals(label);

    var labels = TT.Model.Story.removeTag(story, label).labels;
    TT.Model.Story.saveLabels(story, labels);

    return false;
  };

  pub.editStoryTags = function () {
    var story = getStoryFromContext(this);

    var labels = $.map(TT.Model.Label.get(), function (label) {
      return { name: label.name, value: label.name };
    });

    TT.Autocomplete.open({
      css: { width: 240 },
      items: TT.Utils.sortByProperty(labels, 'name'),
      target: $(this).closest('.labels'),
      noActive: true,
      showInput: true,
      onApply: function (label) {
        var labels = TT.Model.Story.addTag(story, label.toLowerCase()).labels;
        TT.Model.Story.saveLabels(story, labels);
      }
    });

    return false;
  };

  pub.editStoryTitle = function () {
    var story = getStoryFromContext(this);

    return addStoryEditor(this, story, 'name', {
      text: story.name,
      onSave: 'TT.UI.saveStoryTitle',
      onCancel: 'TT.UI.cancelEditTitle'
    });
  };

  pub.editStoryDescription = function () {
    var story = getStoryFromContext(this);

    return addStoryEditor(this, story, 'description', {
      text: story.description,
      onSave: 'TT.UI.saveStoryDescription',
      onCancel: 'TT.UI.cancelEditDescription'
    });
  };

  pub.addStoryNote = function () {
    var story = getStoryFromContext(this);

    return addStoryEditor(this, story, 'note', {
      onSave: 'TT.UI.saveStoryNote',
      onCancel: 'TT.UI.cancelStoryNote'
    });
  };

  function addStoryEditor(context, story, name, actions) {
    var html = TT.View.render('textarea', actions);

    var textarea = TT.View.attach(html, context, 'insertAfter').find('textarea');
    textarea.focus().autosize().bind('keyup blur', function () {
      var data = {};
      data[name] = textarea.val();
      data[name + 'Height'] = textarea.height();

      TT.Utils.updateStoryState(story.id, data);
    });

    $(context).hide();

    return false;
  }

  pub.saveStoryTitle = function () {
    var story = getStoryFromContext(this);
    var name = $(this).closest('.textarea').find('textarea').val();
    var formatted_name = name ? TT.Utils.showdownLite(name) : '';

    if (!name) {
      TT.View.message('Title is required.', 'error');
      return false;
    }

    TT.Model.Story.saveTitle(story, name, formatted_name);

    $(this).closest('.story').find('.title').show().html(formatted_name);
    $(this).closest('.textarea').remove();

    return false;
  };

  pub.saveStoryDescription = function () {
    var story = getStoryFromContext(this);
    var description = $(this).closest('.textarea').find('textarea').val();
    var formatted_description = description ? TT.Utils.showdownLite(description) : '<span class="ghost">Click to add a description</span>';

    TT.Model.Story.saveDescription(story, description, formatted_description);

    $(this).closest('.story').find('.description').show().html(formatted_description);
    $(this).closest('.textarea').remove();

    return false;
  };

  pub.saveStoryNote = function () {
    var story = getStoryFromContext(this);
    var comment = $(this).closest('.textarea').find('textarea').val();

    if (!comment) {
      TT.View.message('Your note is empty.', 'error');
      return false;
    }

    TT.Model.Story.saveComment(story, comment, function () {
      TT.View.redrawStory(story);
    });

    $(this).closest('.story').find('.add-note').show();
    $(this).closest('.textarea').remove();

    return false;
  };

  pub.cancelEditTitle = function () {
    return cancelStoryEdit(this, {
      selector: '.title',
      state: { name: null, nameHeight: null }
    });
  };

  pub.cancelEditDescription = function () {
    return cancelStoryEdit(this, {
      selector: '.description',
      state: { description: null, descriptionHeight: null }
    });
  };

  pub.cancelStoryNote = function () {
    return cancelStoryEdit(this, {
      selector: '.add-note',
      state: { note: null, noteHeight: null }
    });
  };

  function cancelStoryEdit(context, options) {
    var story = getStoryFromContext(context);
    TT.Utils.updateStoryState(story.id, options.state);

    $(context).closest('.story').find(options.selector).show();
    $(context).closest('.textarea').remove();

    return false;
  }

  pub.loadIcebox = function () {
    $(this).closest('.column-note').remove();

    var column = TT.Model.Column.get({ name: 'Icebox' });
    column.sortable = true;
    column.template = null;

    TT.Search.requestMatchingStories('state:unscheduled');

    return false;
  };

  pub.showEpicDetails = function (e) {
    if (!TT.Tooltip.isActive()) {
      var data = {
        name: $.trim($(this).siblings('.tag').text()),
        details: []
      };
      $(this).find('.epic').each(function () {
        if ($(this).data('stories')) {
          data.details[data.details.length] = {
            name: $(this).data('name'),
            stories: $(this).data('stories'),
            points: $(this).data('points')
          };
        }
      });
      TT.Tooltip.open({
        target: this,
        html: TT.View.render('epicDetails', data)
      });
    }
    return false;
  };

  pub.init = function () {
    var timeoutID;
    $('body').click(function (e) {
      var target = $(e.target).closest('[data-click-handler]');
      var handler = target.data('click-handler');
      if (handler) {
        handler = TT.Utils.strToFunction(handler);
        if (TT.Utils.isFunction(handler)) {
          return handler.call(target[0], e);
        }
      }
    }).mousemove(function (e) {
      clearTimeout(timeoutID);
      timeoutID = setTimeout(function () {
        var target = $(e.target).closest('[data-hover-handler]');
        var handler = target.data('hover-handler');
        if (handler) {
          handler = TT.Utils.strToFunction(handler);
          if (TT.Utils.isFunction(handler)) {
            return handler.call(target[0], e);
          }
        }
      }, 100);
    });
  };

  return pub;

}());
