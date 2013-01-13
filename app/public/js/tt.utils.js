var TT = TT || {};
TT.Utils = (function () {

  var pub = {};

  // If only one item exists, Pivotal API sends that by itself, otherwise as an array of items
  pub.normalizePivotalArray = function (items) {
    return !items ? [] : $.isPlainObject(items) ? [items] : items;
  };

  pub.getUsername = function () {
    return $.cookie('pivotalUsername') || '';
  };

  pub.getToken = function () {
    return $.cookie('pivotalToken') || '';
  };

  pub.keyPressed = function (e, key) {
    var keys = {
      'TAB': 9,
      'ENTER': 13,
      'ESCAPE': 27,
      'LEFT_ARROW': 37,
      'UP_ARROW': 38,
      'RIGHT_ARROW': 39,
      'DOWN_ARROW': 40
    };

    return e && e.which === keys[key];
  };

  pub.exists = function (obj) {
    return typeof obj !== 'undefined' && obj !== null;
  };

  // from underscore
  pub.isObject = function (obj) {
    return obj === Object(obj);
  };

  $.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function (index, type) {
    pub['is' + type] = function (obj) {
      return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    };
  });

  pub.arrayMove = function (arr, oldIndex, newIndex) {
    if (newIndex >= arr.length) {
      var k = newIndex - arr.length;
      while ((k--) + 1) {
        arr.push(undefined);
      }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
    return arr;
  };

  pub.localStorage = function (key, value) {
    try {
      if (window.localStorage) {
        key = 'TT.' + key;

        if (pub.exists(value)) {
          if (!pub.isString(value)) {
            value = JSON.stringify(value);
          }
          window.localStorage[key] = value;
        }

        if (value === null) {
          window.localStorage.removeItem(key);
        }

        return window.localStorage[key];
      }
    } catch (e) {
      TT.View.message('This browser does not support localStorage. You should use the latest version of Chrome, Firefox, or Safari.');
    }
  };

  pub.strToFunction = function (functionName, context) {
    context = context || window;
    var namespaces = functionName.split('.');
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
      if (!context[namespaces[i]]) {
        return false;
      }
      context = context[namespaces[i]];
    }
    return context[func];
  };

  pub.cssify = function (str) {
    return str.toLowerCase().replace(/[^a-z0-9\-\_]/g, '');
  };

  pub.generateInitials = function (text) {
    var initials = '';
    var words = text.replace(/[^a-zA-Z0-9 ]/g, '').split(' ');
    $.each(words, function (index, word) {
      initials += word[0] ? word[0] : '';
    });

    return initials;
  };

  pub.showdownLite = function (text) {
    if (pub.isString(text)) {
      // <br />
      text = text.replace(/\n/g, '<br />');
      // <strong> must go first
      text = text.replace(/(\*)(?=\S)([^\r]*?\S[*]*)\1/g, '<strong>$2</strong>');
      // <em>
      text = text.replace(/(\w)_(\w)/g, '$1[[underscore]]$2'); // ** GFM **  "~E95E" == escaped "_"
      text = text.replace(/(_)(?=\S)([^\r]*?\S)\1/g, '<em>$2</em>');
      text = text.replace(/\[\[underscore\]\]/g, '_');
    }

    return text;
  };

  pub.linebreaks = function (text) {
    if (pub.isString(text)) {
      // <br />
      text = text.replace(/\n+\s+\n+/g, '<br /><br />');
      text = text.replace(/\n/g, '<br />');
    }

    return text;
  };

  pub.removeFromArray = function (arr, val) {
    $.each(arr, function (index, item) {
      if (val === item) {
        arr.splice(index, 1);
      }
    });
    return arr;
  };

  pub.sortByProperty = function (arr, prop) {
    return arr.sort(function (a, b) {
      return a[prop] > b[prop] ? 1 : a[prop] === b[prop] ? 0 : -1;
    });
  };

  pub.updateStoryState = function (id, state) {
    var existingState = pub.getStoryState(id);
    state = pub.isObject(state) ? $.extend({}, existingState, state) : existingState;

    var isEmpty = true;
    $.each(state, function (key, val) {
      if (pub.exists(val)) {
        isEmpty = false;
      } else {
        delete state[key];
      }
    });

    pub.localStorage('storyState.' + id, isEmpty ? null : state);
  };

  pub.getStoryState = function (id) {
    var obj = pub.localStorage('storyState.' + id);
    return pub.exists(obj) ? JSON.parse(obj) : {};
  };

  return pub;

}());
