var TT = TT || {};
TT.Search = (function () {

  var pub = {};

  function enterKeyPressed(e) {
    return e.which === 13;
  }

  pub.addSearchTag = function (term) {
    TT.Model.Filter.add({
      name: term,
      type: 'search',
      fn: function (story) {
        return JSON.stringify(story).toLowerCase().indexOf(term) !== -1;
      }
    });
    TT.View.drawStories();
  };

  pub.includeDone = function () {
    return $('#includeDone').is(':checked');
  };

  pub.requestMatchingStories = function (term) {
    TT.View.message('Searching for <strong>' + term + '</strong>...');
    if (pub.includeDone()) {
      term += ' includedone:true';
    }
    TT.Model.Project.each(function (index, project) {
      TT.Ajax.start();
      $.ajax({
        url: '/stories',
        data: { projectID: project.id, filter: term },
        success: function (stories) {
          stories = TT.API.normalizePivotalArray(stories.story);
          if (stories) {
            TT.View.message('Found <strong>' + stories.length + '</strong> stories in <strong>' + project.name + '</strong>');
            $.each(stories, function (index, story) {
              story.id = parseInt(story.id, 10);
              TT.Model.Story.overwrite(story);
            });
            TT.View.drawStories();
          } else {
            TT.View.message('No results found in <strong>' + project.name + '</strong>');
          }
          TT.Ajax.end();
        }
      });
    });
  };

  pub.submitSearch = function () {
    var search = $('#search input');
    var term = $.trim(search.val().toLowerCase());
    if (term) {
      pub.addSearchTag(term);
      pub.requestMatchingStories(term);
    }
    search.val('');
  };

  pub.init = function () {
    var timeout;
    $('#search input').blur(function () {
      $(this).val('');
    }).keyup(function (e) {
      if (enterKeyPressed(e)) {
        pub.submitSearch();
      }
    });
  };

  return pub;

}());
