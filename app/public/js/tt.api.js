// Controller functions called after server-side response

TT.API = (function () {

  var pub = {};

  // If only one item exists, Pivotal API sends that by itself, otherwise as an array of items
  function normalizePivotalArray(items) {
    return $.isPlainObject(items) ? [items] : items;
  }

  function addEach(items, addFn) {
    if (items) {
      items = normalizePivotalArray(items);
      $.each(items, function (index, item) {
        addFn(item);
      });
    }
  }

  pub.addProjects = function (projects) {
    $.each(normalizePivotalArray(projects), function (index, project) {
      TT.Model.Project.add(project);
      if (project.memberships && project.memberships.membership) {
        addEach(project.memberships.membership, TT.Model.User.add);
      }
    });
  };

  pub.addIterations = function (iterations) {
    $.each(normalizePivotalArray(iterations), function (index, iteration) {
      if (iteration.stories && iteration.stories.story) {
        addEach(iteration.stories.story, TT.Model.Story.add);
      }
    });
  };

  return pub;

}());
