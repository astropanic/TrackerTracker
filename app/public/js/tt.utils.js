var TT = TT || {};
TT.Utils = (function () {

  var pub = {};

  // If only one item exists, Pivotal API sends that by itself, otherwise as an array of items
  pub.normalizePivotalArray = function (items) {
    return !items ? [] : $.isPlainObject(items) ? [items] : items;
  };

  var pad = function (n) {
    return n < 10 ? '0' + n : n;
  };

  pub.pivotalDateFormat = function (d) {
    d = new Date(d);
    return d.getFullYear() + '/' +
      pad(d.getMonth() + 1) + '/' +
      pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' +
      pad(d.getMinutes()) + ':' +
      pad(d.getSeconds());
  };

  pub.daysBetweenDates = function (str1, str2) {
    return Math.floor((Date.parse(str2) - Date.parse(str1)) / 86400000);
  };

  pub.getUsername = function () {
    return $.cookie('pivotalUsername') || '';
  };

  pub.getToken = function () {
    return $.cookie('pivotalToken') || '';
  };

  pub.keyPressed = function (e, key) {
    var keys = {
      'LEFT_CLICK': 1,
      'MIDDLE_CLICK': 2,
      'RIGHT_CLICK': 3,
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

  pub.isDomElement = function (obj) {
    return !!(obj && obj.nodeType === 1);
  };

  $.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Array'], function (index, type) {
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

  function localStorageWarning() {
    TT.View.message('This browser does not support localStorage. You should use the latest version of Chrome, Firefox, or Safari.');
  }

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
      localStorageWarning();
    }
  };

  pub.clearLocalStorage = function () {
    try {
      if (window.localStorage) {
        // need to iterate in reverse since window.localStorage.length changes after removing an item
        for (var i = window.localStorage.length - 1; i >= 0; i--) {
          var key = window.localStorage.key(i);
          if (key.indexOf('TT.') === 0) {
            window.localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      localStorageWarning();
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

  pub.objectLength = function (obj) {
    return obj ? $.map(obj, function (n, i) { return i; }).length : 0;
  };

  pub.objectSum = function (obj) {
    var sum = 0;
    $.each(obj, function (index, name) {
      sum += (parseInt(name, 10) || 0);
    });

    return sum;
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
