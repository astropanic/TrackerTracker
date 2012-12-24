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
