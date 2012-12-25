TT.Utils = (function () {

  var pub = {};

  pub.strToFunction = function (functionName, context) {
    context = context || window;
    var namespaces = functionName.split(".");
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
