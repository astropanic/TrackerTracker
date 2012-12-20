var TT = (function () {

  var pub = {};

  pub.Templates = {};
  pub.Columns = {};
  pub.Filters = {};
  pub.Layout = {};

  pub.activeServerRequests = 0;

  pub.noop = function () {};

  pub.initStorage = function () {
    pub.Projects = {};
    pub.Stories = {};
    pub.Users = {};
  };

  // ajax UI state

  pub.ajaxStart = function () {
    pub.activeServerRequests++;
    $('body').addClass('ajaxRunning');
  };

  pub.ajaxEnd = function () {
    pub.activeServerRequests--;
    if (!pub.activeServerRequests) {
      $('body').removeClass('ajaxRunning');
    }
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
    if (!pub.Filters[filter.name] || !pub.Filters[filter.name].active) {
      var html = pub.render('filter', filter);
      pub.attach(html, '#filters');
    }

    filter.active = true;
    pub.Filters[filter.name] = filter;
  };

  // abstracted client-side templates
  pub.render = function (name, data) {
    if (!pub.Templates[name]) {
      pub.Templates[name] = new Hogan.Template(HoganTemplates[name]);
    }
    return pub.Templates[name].render(data);
  };

  // render a collection
  pub.renderAll = function (name, items) {
    var html = '';
    $.each(items, function (index, item) {
      html += pub.render(name, item);
    });
    return html;
  };

  pub.attach = function (html, target) {
    var element = $(target).append(html);
    if (html.indexOf('data-click-handler') !== -1) {
      pub.initClickHandlers(element);
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
    s.src = url + (data ? '?' + $.param(data) : '');
    s.onload = callback || pub.noop;
    document.getElementsByTagName('head')[0].appendChild(s);
    pub.ajaxStart();
  };

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

  pub.updateStoryView = function () {
    pub.setProjectActiveState();
    pub.clearStoryView();
    $.each(pub.Stories, function (index, story) {
      $.each(pub.Layout, function (index, name) {
        var column = pub.Columns[name];
        if (column.fn(story) && pub.projectIsActive(story.project_id) && pub.storyIsNotFiltered(story)) {
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

  pub.updateColumnDimensions = function () {
    var $window = $(window);
    var $columns = $('#columns .column');

    var padding = 20;
    var height = $window.height() - ($('.column-bucket').offset().top + padding);
    $('.column-bucket').height(height);

    var column_count = $columns.length;
    var width = ($window.width() - 20 - (column_count * 8)) / column_count;
    $columns.width(width);
  };

  pub.storyHasTag = function (story, tag) {
    if (story.labels && tag) {
      return $.inArray(tag, story.labels) !== -1;
    }
    return false;
  };

  pub.onDomReady = function () {
    pub.initStorage();
    pub.initLayout();
    pub.initColumns();

    pub.updateColumnDimensions();
    $(window).resize(pub.updateColumnDimensions);

    pub.request('/projects', {}, function () {
      $.each(pub.Projects, function (index, project) {
        pub.request('/iterations', { project: project.id });
      });
      pub.updateColumnDimensions();
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
    setTimeout(TT.updateStoryView, 10);
    // intentionally not returning false here so the label click bubbles to the checkbox
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
    return false;
  };

  pub.requestToken = function () {
    var formView = TT.render('tokenForm');
    TT.Dialog.open(formView);
  };

  pub.submitToken = function () {
    var token = $('#token-input').val();
    if (!token) {
      return false;
    }
    $.post('/token', { token: token }, function() {
      TT.Dialog.close();
    });
    return false;
  };

  pub.filterByProject = function () {
    var id = $(this).data('project-id');
    $('#projects .project input:checked').attr('checked', false);
    $('#project-' + id).click();

    TT.updateStoryView();
    return false;
  };

  pub.filterByUser = function () {
    var name = $(this).data('username');

    TT.addFilter({
      name: 'User: ' + name,
      fn: function (story) {
        return story.owned_by === name || story.requested_by === name;
      }
    });

    TT.updateStoryView();
    return false;
  };

  pub.filterByTag = function () {
    var tag = $.trim($(this).text());

    TT.addFilter({
      name: 'Tag: ' + tag,
      fn: function (story) {
        return TT.storyHasTag(story, tag);
      }
    })

    TT.updateStoryView();
    return false;
  };

  pub.removeFilter = function () {
    var name = $.trim($(this).text());

    TT.Filters[name].active = false;
    $(this).remove();
    TT.updateStoryView();
    return false;
  };

  return pub;

}());

// Controller functions called by server-side response

TT.API = (function () {

  var pub = {};

  function addEach(items, addFn) {
    if (items) {
      // If only one item exists, Pivotal API sends that by itself, otherwise as an array of items
      if ($.isPlainObject(items)) {
        items = [items];
      }
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
    TT.ajaxEnd();
  };

  pub.addIterations = function (iterations) {
    $.each(iterations.iteration, function (index, iteration) {
      if (iteration.stories && iteration.stories.story) {
        addEach(iteration.stories.story, TT.addStory);
      }
    });

    TT.updateStoryView();
    TT.ajaxEnd();
  };

  return pub;

}());

// Readymade columns
// TODO: Allow creating & saving custom columns and layouts

TT.addColumn({
  name: 'Backlog',
  fn: function (story) {
    return story.current_state === 'unstarted';
  },
  actions: [
    {
      name: 'Start',
      target: '.column-started .column-bucket',
      action: function (story) { return { current_state: 'started' }; }
    }
  ]
});

TT.addColumn({
  name: 'Started',
  fn: function (story) {
    return story.current_state === 'started';
  },
  actions: [
    {
      name: 'Ready for QA',
      target: '.column-inqa .column-bucket',
      action: function (story) { return { current_state: 'finished' }; }
    },
    {
      name: 'Passed QA',
      target: '.column-passedqa .column-bucket',
      action: function (story) { return {}; }
    }
  ]
});

TT.addColumn({
  name: 'In QA',
  fn: function (story) {
    return story.current_state === 'finished';
  }
});

TT.addColumn({
  name: 'Passed QA',
  fn: function (story) {
    return story.current_state === 'finished' && TT.storyHasTag(story, 'passedqa');
  }
});

TT.addColumn({
  name: 'Delivered',
  fn: function (story) {
    return story.current_state === 'delivered';
  }
});

TT.addColumn({
  name: 'Accepted',
  fn: function (story) {
    return story.current_state === 'accepted';
  }
});

// bind init to jQuery on DOM Ready

$(TT.onDomReady);
