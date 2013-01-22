var TT = TT || {};
TT.Model = (function () {

  var pub = {};

  function matcherObjectToFunction(matchers) {
    return function (obj) {
      if (!obj) {
        return false;
      }

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
      if (!obj) {
        return obj;
      }

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

  pub.Model = function (name) {
    var self = {};

    self.DB = [];
    self.name = name;

    self.clientSave = function () {
      var copy = [];
      self.each(function (index, item) {
        copy[index] = {};
        $.each(item, function (key, value) {
          if (TT.Utils.isFunction(value)) {
            value = '(' + value + ');';
          }
          // this will fail on DOM elements, need to handle that
          copy[index][key] = value;
        });
      });
      return TT.Utils.localStorage(self.name, JSON.stringify(copy));
    };

    self.clientLoad = function () {
      return TT.Utils.localStorage(self.name);
    };

    self.find = function (query, returnIndex) {
      return find(self.DB, query, returnIndex);
    };

    self.get = function (query) {
      return query ? self.find(query)[0] : self.DB;
    };

    self.index = function (query) {
      return find(self.DB, query, true)[0];
    };

    self.isEmpty = function (query) {
      return self.find(query).length === 0;
    };

    self.each = function (fn) {
      return $.each(self.DB, fn);
    };

    self.update = function (query, updateFn) {
      return update(self.DB, query, updateFn);
    };

    self.tick = function (query, prop) {
      return self.update(query, function (obj) {
        obj[prop] = obj[prop] ? obj[prop] + 1 : 1;
        return obj;
      });
    };

    self.move = function (oldIndex, newIndex) {
      self.DB = TT.Utils.arrayMove(self.DB, oldIndex, newIndex);
    };

    self.add = function (obj, key) {
      if (self.onBeforeAdd) {
        obj = self.onBeforeAdd(obj);
      }

      var index = self.DB.length;
      if (key && obj[key]) {
        var query = {};
        query[key] = obj[key];
        index = self.index(query);
        if (!TT.Utils.isNumber(index)) {
          index = self.DB.length;
        }
        self.DB[index] = $.extend({}, self.DB[index], obj);
      } else {
        self.DB[index] = obj;
      }
    };

    self.overwrite = function (obj, key) {
      return self.add(obj, key || 'id');
    };

    self.remove = function (query) {
      if (TT.Utils.isObject(query)) {
        query = matcherObjectToFunction(query);
      }
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
  };

  pub.Column = pub.Model('Column');

  pub.Column.onBeforeAdd = function (column) {
    column.sortable = column.sortable === false ? column.sortable : true;
    column.class_name = 'column-' + TT.Utils.cssify(column.name);
    return column;
  };

  pub.Filter = pub.Model('Filter');

  pub.Filter.add = function (filter) {
    var foundFilter = pub.Filter.get({ name: filter.name });

    if (!foundFilter) {
      filter.active = filter.active === false ? false : true;
      filter.sticky = filter.sticky === true ? true : false;
      filter.id = TT.Utils.cssify(filter.type + '-' + filter.name);
      pub.Filter.DB[pub.Filter.DB.length] = filter;
      TT.View.drawFilter(filter);
    } else if (foundFilter.active === false) {
      $('.filter[data-filter-id="' + foundFilter.id + '"]').click();
    }
    pub.Filter.clientSave();
  };

  pub.Label = pub.Model('Label');

  pub.Label.onBeforeAdd = function (label) {
    label.unscheduled = {};
    label.unstarted = {};
    label.started = {};
    label.finished = {};
    label.rejected = {};
    label.delivered = {};
    label.accepted = {};

    return label;
  };

  pub.Label.removeStory = function (label, id) {
    if (TT.Utils.isString(label)) {
      label = pub.Label.get({ name: label });
    }
    if (!TT.Utils.isObject(label)) {
      return {};
    }

    $.each(['unscheduled', 'unstarted', 'started', 'finished', 'rejected', 'delivered', 'accepted'], function (index, name) {
      if (label[name] && TT.Utils.exists(label[name][id])) {
        delete label[name][id];
      }
    });

    pub.Label.update({ name: label.name }, label);
    return label;
  };

  pub.Label.recalculateTotals = function (label) {
    if (TT.Utils.isString(label)) {
      label = pub.Label.get({ name: label });
    }
    if (!TT.Utils.isObject(label)) {
      return {};
    }

    label.active = false;

    $.each(['unscheduled', 'unstarted', 'started', 'finished', 'rejected', 'delivered', 'accepted'], function (index, name) {
      var stories = TT.Utils.objectLength(label[name]);
      if (stories) {
        label.active = true;
      }
      label[name + 'Count'] = stories;
      label[name + 'Points'] = TT.Utils.objectSum(label[name]);
    });

    return label;
  };

  pub.Label.addStoryLabelsToEpics = function (story) {
    $.each(story.labels, function (index, label) {
      var myLabel = pub.Label.get({ name: label });
      pub.Label.removeStory(myLabel, story.id);
      myLabel[story.current_state][story.id] = story.estimate;
      pub.Label.recalculateTotals(myLabel);
    });
  };

  pub.Layout = pub.Model('Layout');

  pub.Project = pub.Model('Project');

  pub.Project.onBeforeAdd = function (project) {
    project.id = parseInt(project.id, 10);
    project.active = true;

    return project;
  };

  pub.Project.isActive = function (query) {
    return !!pub.Project.get(query).active;
  };

  pub.Story = pub.Model('Story');

  pub.Story.onBeforeAdd = function (story) {
    story.id = parseInt(story.id, 10);
    story.project_id = parseInt(story.project_id, 10);
    story.formatted_name = TT.Utils.showdownLite(story.name);
    story.description = TT.Utils.isString(story.description) ? story.description : '';
    story.formatted_description = story.description ? TT.Utils.showdownLite(story.description) : '<span class="ghost">Click to add a description</span>';
    story.estimate = story.estimate >= 0 ? story.estimate : '';
    story.labels = story.labels ? story.labels.indexOf(',') !== -1 ? story.labels.split(',') : [story.labels] : [];
    story.notes = compileNotes(story);

    var project = pub.Project.get({ id: story.project_id }) || {};
    var user = pub.User.get({ name: story.owned_by }) || {};

    story.initials = user.initials;
    story.project_name = TT.Utils.generateInitials(project.name);
    story.project_classname = TT.Utils.cssify(project.name);

    pub.Label.addStoryLabelsToEpics(story);

    return story;
  };

  function isImage(filename) {
    return (/\.(gif|jpg|jpeg|png)$/i).test(filename);
  }

  function compileNotes(story) {
    if (story.notes && story.notes.note) {
      story.notes = $.map(TT.Utils.normalizePivotalArray(story.notes.note), function (note, index) {
        if (TT.Utils.isString(note.text)) {
          note.text = TT.Utils.linebreaks(note.text);
        } else {
          note.text = '';
        }
        note.timestamp = new Date(note.noted_at).getTime();
        note.attachments = [];

        return note;
      });
    } else {
      story.notes = [];
    }

    if (story.attachments && story.attachments.attachment) {
      $.each(TT.Utils.normalizePivotalArray(story.attachments.attachment), function (index, attachment) {
        attachment.timestamp = new Date(attachment.uploaded_at).getTime();
        attachment.isImage = isImage(attachment.filename);
        if (TT.Utils.isString(attachment.description)) {
          var noteIndex = find(story.notes, { text: attachment.description }, true)[0];
          attachment.description = TT.Utils.linebreaks(attachment.description);
          if (TT.Utils.isNumber(noteIndex)) {
            story.notes[noteIndex].attachments.push(attachment);
            return;
          }
        } else {
          attachment.description = '';
        }

        story.notes[story.notes.length] = {
          timestamp: attachment.timestamp,
          text: attachment.description,
          author: attachment.uploaded_by,
          noted_at: attachment.uploaded_at,
          isImage: attachment.isImage,
          id: parseInt(attachment.id, 10),
          attachments: [
            {
              url: attachment.url,
              filename: attachment.filename
            }
          ]
        };
      });
    }

    return TT.Utils.sortByProperty(story.notes, 'timestamp').reverse();
  }

  pub.Story.onBeforeSave = function (data) {
    if (data.labels) {
      data.labels = data.labels.join(',');
    }

    return data;
  };

  pub.Story.isNotFiltered = function (story) {
    var result = false;
    var noFilters = true;

    TT.Model.Filter.each(function (index, filter) {
      if (filter.active) {
        noFilters = false;
        if (filter.fn(story)) {
          result = true;
        }
      }
    });

    return noFilters || result;
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

  pub.Story.serverSave = function (story, data, callback) {
    TT.Ajax.post('/updateStory', {
      data: {
        projectID: story.project_id,
        storyID: story.id,
        data: pub.Story.onBeforeSave(data)
      },
      callback: callback
    });
  };

  pub.Story.saveLabels = function (story, labels) {
    pub.Story.update({ id: story.id }, { labels: labels });
    pub.Story.serverSave(story, { labels: labels });
    TT.View.redrawStory(story);
    pub.Label.addStoryLabelsToEpics(story);
    TT.View.drawColumnTemplates();
  };

  pub.Story.saveTitle = function (story, name, formatted_name) {
    TT.Utils.updateStoryState(story.id, { name: null, nameHeight: null });

    pub.Story.update({ id: story.id }, {
      name: name,
      formatted_name: formatted_name
    });
    pub.Story.serverSave(story, { name: name });
  };

  pub.Story.saveDescription = function (story, description, formatted_description) {
    TT.Utils.updateStoryState(story.id, { description: null, descriptionHeight: null });

    pub.Story.update({ id: story.id }, {
      description: description,
      formatted_description: formatted_description
    });
    pub.Story.serverSave(story, { description: description });
  };

  pub.Story.saveComment = function (story, comment, callback) {
    TT.Utils.updateStoryState(story.id, { note: null, noteHeight: null });

    story.notes.unshift({
      timestamp: new Date().getTime(),
      text: comment,
      author: TT.Utils.getUsername(),
      noted_at: new Date() + '',
      isImage: false
    });

    pub.Story.update({ id: story.id }, { notes: story.notes });

    TT.Ajax.post('/addStoryComment', {
      data: {
        projectID: story.project_id,
        storyID: story.id,
        comment: comment
      },
      callback: callback
    });
  };

  pub.User = pub.Model('User');

  pub.User.onBeforeAdd = function (user) {
    return {
      id: parseInt(user.id, 10),
      initials: user.person.initials,
      name: user.person.name,
      email: user.person.email
    };
  };

  return pub;

}());
