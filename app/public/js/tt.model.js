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

  function search(collection, query, returnIndex) {
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

    self.search = function (query, returnIndex) {
      return search(self.DB, query, returnIndex);
    };

    self.get = function (query) {
      return query ? search(self.DB, query)[0] : self.DB;
    };

    self.index = function (query) {
      return search(self.DB, query, true)[0];
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

    self.import = function (DB) {
      self.DB = DB;
    };

    return self;
  }

  pub.Column = new Model('Column');

  pub.Column.onBeforeAdd = function (column) {
    column.class_name = 'column-' + TT.Utils.cssify(column.name);
    return column;
  };

  pub.Layout = new Model('Layout');

  pub.Layout.activate = function (name) {
    pub.Layout.update({ name: name }, function (obj) {
      obj.active = true;
      return obj;
    });
  };

  pub.Layout.deactivate = function (name) {
    pub.Layout.update({ name: name }, function (obj) {
      obj.active = false;
      return obj;
    });
  };

  pub.Story = new Model('Story');

  pub.Story.onBeforeAdd = function (story) {
    story.id = parseInt(story.id);
    story.name = TT.Utils.showdownLite(story.name);
    story.description = story.description.length ? TT.Utils.showdownLite(story.description) : '';
    story.estimate = story.estimate >= 0 ? story.estimate : '';
    story.initials = TT.Utils.usernameToInitials(story.owned_by);
    story.project_name = TT.Utils.generateInitials(TT.getProjectNameFromID(story.project_id));
    story.project_classname = TT.Utils.cssify(TT.getProjectNameFromID(story.project_id));
    story.labels = story.labels ? story.labels.indexOf(',') !== -1 ? story.labels.split(',') : [story.labels] : [];
    if (story.notes && story.notes.note) {
      story.notes = story.notes.note;
    }
    return story;
  };

  pub.Story.isNotFiltered = function (story) {
    var result = true;
    $.each(TT.Filters, function (index, filter) {
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

  pub.Story.addTag = function (tags, tag) {
    if ($.inArray(tag, tags) === -1) {
      tags[tags.length] = tag;
    }
    return tags;
  };

  pub.Story.removeTag = function (tags, tag) {
    return TT.Utils.removeFromArray(tags, tag);
  };

  return pub;

}());
