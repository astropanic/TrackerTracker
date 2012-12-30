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
    return $.isPlainObject(items) ? [items] : items;
  };

  pub.addProjects = function (projects) {
    $.each(pub.normalizePivotalArray(projects), function (index, project) {
      TT.Model.Project.add(project);
      if (project.memberships && project.memberships.membership) {
        addEach(project.memberships.membership, TT.Model.User.add);
      }
    });
  };

  pub.addIterations = function (iterations) {
    $.each(pub.normalizePivotalArray(iterations), function (index, iteration) {
      if (iteration.stories && iteration.stories.story) {
        addEach(iteration.stories.story, TT.Model.Story.add);
      }
    });
  };

  return pub;

}());
