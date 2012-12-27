TT.Search = (function () {

  var pub = {};

  function enterKeyPressed(e) {
    return e.which === 13;
  }

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
    }).keyup(function (e) {
      if (enterKeyPressed(e)) {
        var term = $.trim(search.val().toLowerCase());
        if (term) {
          pub.addSearchTag(term);
        }
        search.val('');
      }
    });
  };

  return pub;

}());
