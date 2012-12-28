TT.Model = (function () {

  var pub = {};

  function matcherObjectToFunction(matchers) {
    return function (obj) {
      var match = true;
      $.each(matchers, function (key, val) {
        if (obj[key] !== val) {
          match = false;
        }
      });
      return match;
    };
  }

  function updateObjectToFunction(updates) {
    return function (obj) {
      $.each(updates, function (key, val) {
        obj[key] = val;
      });
      return obj;
    };
  }

  function find(collection, query, returnIndex) {
    if (TT.Utils.isObject(query)) {
      query = matcherObjectToFunction(query);
    }

    var matches = [];
    $.each(collection, function (index, obj) {
      if (query(obj)) {
        matches[matches.length] = returnIndex ? index : obj;
      }
    });

    return matches;
  }

  function update(collection, matcherFn, updateFn) {
    if (TT.Utils.isObject(matcherFn)) {
      matcherFn = matcherObjectToFunction(matcherFn);
    }
    if (TT.Utils.isObject(updateFn)) {
      updateFn = updateObjectToFunction(updateFn);
    }

    $.each(collection, function (index, obj) {
      if (matcherFn(obj)) {
        collection[index] = updateFn(obj);
      }
    });

    return collection;
  }

  function Model(name) {
    var self = {};

    self.DB = [];
    self.name = name;

    self.save = function () {
      return TT.Utils.localStorage(self.name, JSON.stringify(self.DB));
    };

    self.load = function () {
      return TT.Utils.localStorage(self.name);
    };

    self.find = function (query, returnIndex) {
      return find(self.DB, query, returnIndex);
    };

    self.get = function (query) {
      return query ? find(self.DB, query)[0] : self.DB;
    };

    self.index = function (query) {
      return find(self.DB, query, true)[0];
    };

    self.each = function (fn) {
      return $.each(self.DB, fn);
    };

    self.update = function (query, updateFn) {
      return update(self.DB, query, updateFn);
    };

    self.extend = function (query, data) {
      return update(self.DB, query, function (obj) {
        return $.extend(obj, data);
      });
    };

    self.move = function (oldIndex, newIndex) {
      self.DB = TT.Utils.arrayMove(self.DB, oldIndex, newIndex);
    };

    self.add = function (obj) {
      if (self.onBeforeAdd) {
        obj = self.onBeforeAdd(obj);
      }
      self.DB[self.DB.length] = obj;
    };

    self.remove = function (query) {
      self.each(function (index, obj) {
        if (query(obj)) {
          self.DB.splice(index, 1);
        }
      });
    };

    self.flush = function () {
      self.DB = [];
    };

    self.replace = function (DB) {
      self.DB = DB;
    };

    return self;
  }

  pub.Project = Model('Project');

  pub.Project.onBeforeAdd = function (project) {
    project.id = parseInt(project.id, 10);
    project.active = true;

    return project;
  };

  pub.Project.isActive = function (query) {
    return !!pub.Project.get(query).active;
  };

  pub.User = Model('User');

  pub.User.onBeforeAdd = function (user) {
    return {
      id: user.id,
      initials: user.person.initials,
      name: user.person.name
    };
  };

  pub.Column = Model('Column');

  pub.Column.onBeforeAdd = function (column) {
    column.class_name = 'column-' + TT.Utils.cssify(column.name);
    return column;
  };

  pub.Layout = Model('Layout');

  pub.Story = Model('Story');

  pub.Story.onBeforeAdd = function (story) {
    story.id = parseInt(story.id, 10);
    story.project_id = parseInt(story.project_id, 10);
    story.name = TT.Utils.showdownLite(story.name);
    story.description = story.description.length ? TT.Utils.showdownLite(story.description) : '';
    story.estimate = story.estimate >= 0 ? story.estimate : '';
    story.labels = story.labels ? story.labels.indexOf(',') !== -1 ? story.labels.split(',') : [story.labels] : [];
    if (story.notes && story.notes.note) {
      story.notes = story.notes.note;
    }

    var project = TT.Model.Project.get({ id: story.project_id }) || {};
    var user = TT.Model.User.get({ name: story.owned_by }) || {};

    story.initials = user.initials;
    story.project_name = TT.Utils.generateInitials(project.name);
    story.project_classname = TT.Utils.cssify(project.name);

    return story;
  };

  pub.Story.isNotFiltered = function (story) {
    var result = true;
    TT.Model.Filter.each(function (index, filter) {
      if (result && filter.active && !filter.fn(story)) {
        result = false;
      }
    });

    return result;
  };

  pub.Story.hasTag = function (story, tag) {
    if (story.labels && tag) {
      return $.inArray(tag, story.labels) !== -1;
    }

    return false;
  };

  pub.Story.addTag = function (story, tag) {
    if (!pub.Story.hasTag(story, tag)) {
      story.labels[story.labels.length] = tag;
    }

    return story;
  };

  pub.Story.removeTag = function (story, tag) {
    if (story.labels) {
      story.labels = TT.Utils.removeFromArray(story.labels, tag);
    }

    return story;
  };

  pub.Filter = Model('Filter');

  pub.Filter.add = function (filter) {
    var foundFilter = pub.Filter.get({ name: filter.name });

    if (!foundFilter) {
      filter.active = true;
      filter.element = TT.View.drawFilter(filter);
      pub.Filter.DB[pub.Filter.DB.length] = filter;
    } else if (foundFilter.active === false) {
      TT.UI.reactivateFilter(foundFilter.name);
    }
  };

  return pub;

}());
