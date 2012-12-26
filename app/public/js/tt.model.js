TT.Model = (function () {

  var pub = {};

  pub.search = function (collection, query, returnIndex) {
    var matches = [];

    $.each(collection, function (index, obj) {
      var match = true;
      $.each(query, function (key, value) {
        if (obj[key] !== value) {
          match = false;
        }
      });

      if (match) {
        matches[matches.length] = returnIndex ? index : obj;
      }
    });

    return matches;
  };

  pub.update = function (collection, matcherFn, updateFn) {
    $.each(collection, function (index, obj) {
      if (matcherFn(obj)) {
        collection[index] = updateFn(obj);
      }
    });

    return collection;
  };

  function Model(name) {
    var self = {};

    self.name = name;

    self.save = function () {
      return TT.Utils.localStorage(self.name, JSON.stringify(TT[self.name]));
    };

    self.load = function () {
      return TT.Utils.localStorage(self.name);
    };

    self.search = function (query, returnIndex) {
      return pub.search(TT[self.name], query, returnIndex);
    };

    self.index = function (query) {
      return pub.search(TT[self.name], query, true)[0];
    };

    self.first = function (query) {
      return pub.search(TT[self.name], query)[0];
    };

    self.each = function (fn) {
      return $.each(TT[self.name], fn);
    };

    self.update = function (name, updateFn) {
      return pub.update(TT[self.name], function (obj) {
        return obj.name === name;
      }, updateFn);
    };

    return self;
  }

  pub.Layout = new Model('Layout');

  pub.Layout.activate = function (name) {
    pub.Layout.update(name, function (obj) {
      obj.active = true;
      return obj;
    });
  };

  pub.Layout.deactivate = function (name) {
    pub.Layout.update(name, function (obj) {
      obj.active = false;
      return obj;
    });
  };

  return pub;

}());
