var TT = TT || {};
TT.Search = (function () {

  var pub = {};

  pub.parseSearchQuery = function (term) {
    return term.split(' ').map(function (term) {
      return (term.indexOf(':') !== -1 ? term.split(':')[1] : term).replace(/\'\"/g, '');
    });
  };

  pub.addSearchTag = function (term) {
    var terms = pub.parseSearchQuery(term);

    TT.Model.Filter.add({
      name: term,
      type: 'search',
      fn: function (story) {
        if (terms.length === 0) {
          return true;
        }
        var text = JSON.stringify(story).toLowerCase();
        var match = true;
        $.each(terms, function (i, term) {
          if (text.indexOf(term) === -1) {
            match = false;
          }
        });

        return match;
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
          stories = TT.Utils.normalizePivotalArray(stories.story);
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
      if (TT.Utils.keyPressed(e, 'ENTER')) {
        pub.submitSearch();
      }
    });
  };

  return pub;

}());
