var TT = (function () {

  var pub = {};

  pub.Templates = {};
  pub.Columns = {};
  pub.Filters = {};
  pub.Layout = {};
  pub.Projects = {};
  pub.Stories = {};
  pub.Users = {};

  pub.noop = function () {};

  pub.initStorage = function () {
    pub.Projects = {};
    pub.Stories = {};
    pub.Users = {};
  };

  // abstracted client-side templates
  pub.render = function (name, data) {
    if (!pub.Templates[name]) {
      pub.Templates[name] = new Hogan.Template(HoganTemplates[name]);
    }
    return pub.Templates[name].render(data);
  };

  pub.attach = function (html, target, method) {
    method = method || 'appendTo';
    var element = $(html)[method](target);
    if (html.indexOf('data-click-handler') !== -1) {
      pub.initClickHandlers(element.parent());
    }
    return element;
  };

  pub.initClickHandlers = function (context) {
    $(context || 'body').find('[data-click-handler]').each(function () {
      // console.log('processing click handler', this);
      var handler = pub.Utils.strToFunction($(this).data('click-handler'));
      $(this).click(handler);
    }).removeAttr('data-click-handler');
  };

  pub.request = function (url, data, callback) {
    var s = document.createElement('script');
    s.onload = s.onerror = callback || pub.noop;
    if (data) {
      data.cache_buster = new Date().getTime();
    }
    s.src = url + (data ? '?' + $.param(data) : '');
    document.getElementsByTagName('head')[0].appendChild(s);
    pub.Ajax.start();
  };

  // client-side data manipulation

  pub.addUser = function (user) {
    pub.Users[user.id] = {
      id: user.id,
      initials: user.person.initials,
      name: user.person.name
    };
  };

  pub.addStory = function (story) {
    story.name = TT.Utils.showdownLite(story.name);
    story.description = story.description.length ? TT.Utils.showdownLite(story.description) : '';
    story.estimate = story.estimate >= 0 ? story.estimate : '';
    story.initials = pub.Utils.usernameToInitials(story.owned_by);
    story.project_name = pub.Utils.generateInitials(pub.getProjectNameFromID(story.project_id));
    story.project_classname = pub.Utils.cssify(pub.getProjectNameFromID(story.project_id));
    story.labels = story.labels ? story.labels.indexOf(',') !== -1 ? story.labels.split(',') : [story.labels] : [];
    if (story.notes && story.notes.note) {
      story.notes = story.notes.note;
    }
    pub.Stories[story.id] = story;
  };

  pub.addProject = function (project) {
    project.active = true;
    pub.Projects[project.id] = project;
  };

  pub.addColumn = function (column) {
    column.class_name = 'column-' + pub.Utils.cssify(column.name);
    pub.Columns[column.name] = column;
  };

  pub.addFilter = function (filter) {
    if (!pub.Filters[filter.name]) {
      var html = pub.render('filter', filter);
      filter.element = pub.attach(html, '#filters', 'prependTo');
      filter.active = true;
      pub.Filters[filter.name] = filter;
    } else if (pub.Filters[filter.name].active === false) {
      TT.UI.reactivateFilter(filter.name);
    }
  };

  // helpers

  pub.getProjectNameFromID = function (id) {
    return pub.Projects[id].name;
  };

  pub.setProjectActiveState = function () {
    $('#projects input').each(function () {
      var id = $(this).val();
      var active = $(this).is(':checked');

      pub.Projects[id].active = active;
      if (active) {
        $(this).closest('.project').removeClass('inactive');
      } else {
        $(this).closest('.project').addClass('inactive');
      }
    });
  };

  pub.projectIsActive = function (project_id) {
    return !!pub.Projects[project_id].active;
  };

  pub.storyIsNotFiltered = function (story) {
    var result = true;
    $.each(pub.Filters, function (index, filter) {
      if (result && filter.active && !filter.fn(story)) {
        result = false;
      }
    });

    return result;
  };

  pub.hasTag = function (story, tag) {
    if (story.labels && tag) {
      return $.inArray(tag, story.labels) !== -1;
    }
    return false;
  };

  pub.addTag = function (tags, tag) {
    if ($.inArray(tag, tags) === -1) {
      tags[tags.length] = tag;
    }
    return tags;
  };

  pub.removeTag = function (tags, tag) {
    return TT.Utils.removeFromArray(tags, tag);
  };

  pub.showProjectResetButton = function () {
    if ($('#projects .project.inactive').length > 0) {
      $('#project-reset').css('display', 'inline-block');
    } else {
      $('#project-reset').css('display', 'none');
    }
  };

  pub.refreshStoryView = function () {
    pub.setProjectActiveState();
    pub.clearStoryView();
    pub.showProjectResetButton();

    $.each(pub.Stories, function (index, story) {
      $.each(pub.Layout, function (index, name) {
        var column = pub.Columns[name];
        if (column.filter(story) && pub.projectIsActive(story.project_id) && pub.storyIsNotFiltered(story)) {
          var html = pub.render('story', story);
          pub.attach(html, '.' + column.class_name + ' .column-bucket');
        }
      });
    });
  };

  pub.clearStoryView = function () {
    $('.story').empty().remove();
  };

  pub.initLayout = function () {
    pub.Layout = ['Backlog', 'Started', 'In QA', 'Passed QA', 'Delivered', 'Accepted'];
  };

  pub.initColumns = function () {
    var html = '';
    $.each(pub.Layout, function (index, name) {
      html += pub.render('column', pub.Columns[name]);
    });
    pub.attach(html, '#columns');
  };

  pub.initAccountNav = function () {
    pub.attach(pub.render('accountNav'), '#logo');
  };

  pub.updateColumnDimensions = function () {
    var $window = $(window);
    var $columns = $('#columns .column');

    var padding = 26;
    var height = $window.height() - ($('.column-bucket').offset().top + padding);
    $('.column-bucket').height(height);

    var column_count = $columns.length;
    var width = Math.max(200, Math.round(($window.width() - 24 - (column_count * 8)) / column_count));
    $columns.width(width);

    $('#columns').width((width + 8) * column_count);
  };

  pub.requestData = function () {
    pub.request('/projects', {}, function () {
      $.each(pub.Projects, function (index, project) {
        pub.request('/iterations', { project: project.id });
      });
      pub.updateColumnDimensions();
    });
  };

  pub.onDomReady = function () {
    pub.initStorage();
    pub.initLayout();
    pub.initColumns();

    pub.initAccountNav();

    pub.updateColumnDimensions();
    $(window).resize(pub.updateColumnDimensions);

    TT.DragAndDrop.init();
    TT.Search.init();

    pub.requestData();
  };

  return pub;

}());

TT.Ajax = (function () {

  var pub = {};
  var activeServerRequests = 0;

  // ajax UI state

  pub.start = function () {
    activeServerRequests++;
    $('body').addClass('ajaxRunning');
  };

  pub.end = function () {
    activeServerRequests--;
    if (!activeServerRequests) {
      $('body').removeClass('ajaxRunning');
    }
  };

  return pub;

}());

TT.Search = (function () {

  var pub = {};

  pub.addSearchTag = function (term) {
    TT.addFilter({
      name: term,
      fn: function (story) {
        return JSON.stringify(story).toLowerCase().indexOf(term) !== -1;
      }
    });
    TT.View.drawStories();
  };

  pub.init = function () {
    var timeout;
    var search = $('#search input');
    search.blur(function () {
      search.val('');
    }).keyup(function () {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        var term = $.trim(search.val().toLowerCase());
        if (term) {
          pub.addSearchTag(term);
        }
      }, 500);
    });
  };

  return pub;

}());

TT.DragAndDrop = (function () {

  var pub = {};
  var dragOutFn, dragInFn, columnOut, columnIn;

  pub.getDragFn = function (element, type) {
    var fn;
    element = $(element).closest('.column');

    $.each(TT.Columns, function (index, column) {
      if (element.hasClass(column.class_name)) {
        if (type === 'in' && column.onDragIn) {
          fn = column.onDragIn;
        } else if (type === 'out' && column.onDragOut) {
          fn = column.onDragOut;
        }
      }
    });

    return fn;
  };

  pub.onStart = function (event, ui) {
    columnOut = $(ui.item).closest('.column')[0];
    dragOutFn = pub.getDragFn(ui.item, 'out');
  };

  pub.onBeforeStop = function (event, ui) {
    columnIn = $(ui.item).closest('.column')[0];
    if (columnOut === columnIn) {
      return true;
    }

    var story = TT.Stories[$(ui.item).data('story-id')];
    var data = {};

    dragInFn = pub.getDragFn(ui.item, 'in');

    if (dragOutFn) {
      $.extend(data, dragOutFn(story));
    }
    if (dragInFn) {
      $.extend(data, dragInFn(story));
    }

    if (dragOutFn || dragInFn) {
      $.extend(TT.Stories[story.id], data);
      setTimeout(TT.View.drawStories, 100);

      if (data.labels) {
        data.labels = data.labels.join(',');
      }

      $.post('/updateStory', { project_id: story.project_id, story_id: story.id, data: data });
    }

    dragOutFn = dragInFn = null;
  };

  pub.init = function () {
    $('.sortable-column').sortable({
      cancel: '.expanded-story',
      connectWith: '.sortable-column',
      containment: '#content',
      distance: 10,
      tolerance: 'pointer',
      start: pub.onStart,
      beforeStop: pub.onBeforeStop
    });

    $('#columns').sortable({
      containment: '#content',
      distance: 10,
      handle: '.column-title',
      tolerance: 'pointer',
      start: function (event, ui) {
        ui.placeholder.width(ui.helper.outerWidth());
      }
    });
  };

  return pub;

}());

TT.Utils = (function () {

  var pub = {};

  pub.strToFunction = function (functionName, context) {
    context = context || window;
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
      context = context[namespaces[i]];
    }
    return context[func];
  };

  pub.cssify = function (str) {
    return str.toLowerCase().replace(/[^a-z0-9\-\_]/g, '');
  };

  pub.generateInitials = function(text) {
    var initials = '';
    var words = text.replace(/[^a-zA-Z0-9 ]/g, '').split(' ');
    $.each(words, function (index, word) {
      initials += word[0] ? word[0] : '';
    });

    return initials;
  };

  pub.usernameToInitials = function (name) {
    var initials = '';
    $.each(TT.Users, function (index, user) {
      if (user.name === name) {
        initials = user.initials;
      }
    });
    return initials;
  };

  pub.showdownLite = function(text) {
    // <br />
    text = text.replace(/\n/g, "<br />\n");
    // <strong> must go first
    text = text.replace(/(\*)(?=\S)([^\r]*?\S[*]*)\1/g, "<strong>$2</strong>");
    // <em>
    text = text.replace(/(\w)_(\w)/g, "$1[[underscore]]$2"); // ** GFM **  "~E95E" == escaped "_"
    text = text.replace(/(_)(?=\S)([^\r]*?\S)\1/g, "<em>$2</em>");
    text = text.replace(/\[\[underscore\]\]/g, '_');

    return text;
  };

  pub.removeFromArray = function(arr, val) {
    $.each(arr, function (index, item) {
      if (val === item) {
        arr.splice(index, 1);
      }
    });
    return arr;
  };

  return pub;

}());

// Modal dialog

TT.Dialog = (function () {

  var pub = {};

  pub.open = function (content) {
    pub.close(function () {
      var html = TT.render('modalDialog', { content: content });
      pub.dialog = TT.attach(html, 'body');
    });
  };

  pub.close = function (callback) {
    callback = callback || TT.noop;
    if (pub.dialog) {
      pub.dialog.find('.modal-dialog, .modal-dialog-overlay').fadeOut(180);
      setTimeout(function () {
        pub.dialog.empty().remove();
        pub.dialog = null;
        callback();
      }, 200);
    } else {
      callback();
    }
  };

  return pub;

}());

// Controller functions called by UI elements
// These are bound with data-click-handler attributes in the view.
// "this" is the clicked element

TT.UI = (function () {

  var pub = {};

  pub.selectProject = function () {
    setTimeout(TT.refreshStoryView, 10);
    // intentionally not returning false here so the label click bubbles to the checkbox
  };

  pub.resetProjectList = function () {
    $('#projects .project.inactive label').click();
  };

  pub.hideColumn = function () {
    var name = $.trim($(this).closest('.column-title').text());
    TT.Utils.removeFromArray(TT.Layout, name);
    $(this).closest('.column').empty().remove();
    TT.updateColumnDimensions();

    return false;
  };

  pub.toggleStory = function () {
    $(this).siblings('.details').slideToggle(100);
    $(this).closest('.story').toggleClass('expanded-story');
    return false;
  };

  pub.requestToken = function () {
    var formView = TT.render('accountSettings');
    TT.Dialog.open(formView);

    var pivotalToken = $.cookie('pivotalToken');
    if (pivotalToken) {
      $('#token-input').val(pivotalToken)
    }
  };

  pub.submitToken = function () {
    var pivotalToken = $('#token-input').val();
    if (!pivotalToken) {
      return false;
    }
    $.post('/token', { pivotalToken: pivotalToken }, TT.requestData);
    TT.Dialog.close();
    return false;
  };

  pub.filterByProject = function () {
    var id = $(this).data('project-id');
    $('#projects .project input:checked').attr('checked', false);
    $('#project-' + id).click();

    TT.refreshStoryView();
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

    TT.refreshStoryView();
    return false;
  };

  pub.filterByTag = function () {
    var tag = $.trim($(this).text());

    TT.addFilter({
      name: tag,
      fn: function (story) {
        return TT.hasTag(story, tag);
      }
    })

    TT.refreshStoryView();
    return false;
  };

  pub.removeFilter = function () {
    var name = $.trim($(this).text());

    TT.Filters[name].active = false;
    $(this).addClass('inactive').unbind('click').click(function () {
      pub.reactivateFilter(name);
      return false;
    });
    TT.refreshStoryView();
    return false;
  };

  pub.reactivateFilter = function (name) {
    TT.Filters[name].active = true;
    TT.Filters[name].element.removeClass('inactive').unbind('click').click(pub.removeFilter);
    TT.refreshStoryView();
    return false;
  };

  return pub;

}());

// Controller functions called by server-side response

TT.API = (function () {

  var pub = {};

  // If only one item exists, Pivotal API sends that by itself, otherwise as an array of items
  function normalizePivotalArray(items) {
    return $.isPlainObject(items) ? [items] : items;
  }

  function addEach(items, addFn) {
    if (items) {
      items = normalizePivotalArray(items);
      $.each(items, function (index, item) {
        addFn(item);
      });
    }
  }

  pub.setProjects = function (projects) {
    $.each(projects.project, function (index, project) {
      TT.addProject(project);
      if (project.memberships && project.memberships.membership) {
        addEach(project.memberships.membership, TT.addUser);
      }
    });

    var html = TT.render('projectList', { projects: projects.project });
    TT.attach(html, '#projects');
    TT.Ajax.end();
  };

  pub.addIterations = function (iterations) {
    $.each(normalizePivotalArray(iterations.iteration), function (index, iteration) {
      if (iteration.stories && iteration.stories.story) {
        addEach(iteration.stories.story, TT.addStory);
      }
    });

    TT.refreshStoryView();
    TT.Ajax.end();
  };

  return pub;

}());

// Readymade columns
// TODO: Allow creating & saving custom columns and layouts

TT.addColumn({
  name: 'Backlog',
  filter: function (story) {
    return story.current_state === 'unstarted';
  },
  onDragIn: function (story) {
    return { current_state: 'unstarted' };
  }
});

TT.addColumn({
  name: 'Started',
  filter: function (story) {
    return story.current_state === 'started';
  },
  onDragIn: function (story) {
    return { current_state: 'started' };
  }
});

TT.addColumn({
  name: 'In QA',
  filter: function (story) {
    return story.current_state === 'finished' && !TT.hasTag(story, 'passedqa');
  },
  onDragIn: function (story) {
    return { current_state: 'finished', labels: TT.addTag(story.labels, 'inqa') };
  },
  onDragOut: function (story) {
    return { labels: TT.removeTag(story.labels, 'inqa') };
  }
});

TT.addColumn({
  name: 'Passed QA',
  filter: function (story) {
    return story.current_state === 'finished' && TT.hasTag(story, 'passedqa');
  },
  onDragIn: function (story) {
    return { current_state: 'finished', labels: TT.addTag(story.labels, 'passedqa') };
  },
  onDragOut: function (story) {
    return { labels: TT.removeTag(story.labels, 'passedqa') };
  }
});

TT.addColumn({
  name: 'Delivered',
  filter: function (story) {
    return story.current_state === 'delivered';
  },
  onDragIn: function (story) {
    return { current_state: 'delivered' };
  }
});

TT.addColumn({
  name: 'Accepted',
  filter: function (story) {
    return story.current_state === 'accepted';
  },
  onDragIn: function (story) {
    return { current_state: 'accepted' };
  }
});

// bind init to jQuery on DOM Ready

$(TT.onDomReady);
