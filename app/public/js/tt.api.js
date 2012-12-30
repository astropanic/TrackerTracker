// Controller functions called after server-side response

var TT = TT || {};
TT.API = (function () {

  var pub = {};

  function addEach(items, addFn) {
    if (items) {
      items = pub.normalizePivotalArray(items);
      $.each(items, function (index, item) {
        addFn(item);
      });
    }
  }

  // If only one item exists, Pivotal API sends that by itself, otherwise as an array of items
  pub.normalizePivotalArray = function (items) {
    return !items ? [] : $.isPlainObject(items) ? [items] : items;
  };

  pub.addProjects = function (projects) {
    $.each(pub.normalizePivotalArray(projects), function (index, project) {
      TT.Model.Project.add(project);
      if (project.memberships && project.memberships.membership) {
        var memberships = pub.normalizePivotalArray(project.memberships.membership);
        $.each(memberships, function (index, membership) {
          TT.Model.User.overwrite(membership, 'name');
        });
      }
    });
  };

  pub.addIterations = function (iterations) {
    // This assumes first iteration is always current.
    var current_iteration = true;
    $.each(pub.normalizePivotalArray(iterations), function (index, iteration) {
      if (iteration.stories && iteration.stories.story) {
        var stories = pub.normalizePivotalArray(iteration.stories.story);
        $.each(stories, function (index, story) {
          story.current_iteration = current_iteration;
          TT.Model.Story.add(story);
        });
      }
      current_iteration = false;
    });
  };

  return pub;

}());
