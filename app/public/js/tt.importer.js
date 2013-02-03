var TT = TT || {};
TT.Importer = (function () {

  pub.openDialog = function () {
    TT.Dialog.open(TT.View.render('importDialog'));

    return false;
  };

  pub.showImportPageTwo = function () {
    $('#pivotal-project').focus(pub.openPivotalProjectAutocomplete);
    $('#jira-project').focus(pub.openJiraProjectAutocomplete);
    $('.wizard-page-1').animate({ opacity: 0 }, 200, function () {
      $(this).slideUp(300);
      $('.form-action').removeClass('updating');
      $('.wizard-page-2').css({ opacity: 0 }).slideDown(300, function () {
        $(this).animate({ opacity: 1.0 }, 200);
      });
    });
  };

  pub.openPivotalProjectAutocomplete = function () {
    var items = [];

    TT.Model.Project.each(function (index, project) {
      items[items.length] = {
        name: '<strong>' + project.name + '</strong> (' + project.id + ')',
        value: project.name
      };
    });

    TT.Autocomplete.open({ items: items, target: this });

    return false;
  };

  pub.openJiraProjectAutocomplete = function () {
    var items = [];

    TT.Model.JiraProject.each(function (index, project) {
      items[items.length] = {
        name: '<strong>' + project.name + '</strong> (' + project.key + ')',
        value: project.name
      };
    });

    TT.Autocomplete.open({ items: items, target: this });

    return false;
  };

  pub.getJiraProjects = function () {
    $(this).blur();
    $('.form-action').addClass('updating');
    TT.Ajax.post('/getImportableProjects', {
      data: {
        jiraHost: $('#jira-host').val(),
        jiraPort: $('#jira-port').val(),
        jiraUser: $('#jira-user').val(),
        jiraPassword: $('#jira-password').val()
      },
      callback: function (projects) {
        if (TT.Utils.isArray(projects) && projects.length > 0) {
          TT.Model.JiraProject = TT.Model.Model('JiraProject', projects);
          pub.showImportPageTwo();
        } else {
          $('.form-action').removeClass('updating');
          TT.View.message('<strong>No projects found!</strong> Did you enter the wrong credentials?', 'error');
        }
      }
    });

    return false;
  };

  pub.importJiraProject = function () {
    var jiraProject = $('#jira-project').val();
    var pivotalProject = $('#pivotal-project').val();

    if (jiraProject && pivotalProject) {
      TT.Ajax.post('/importProject', {
        data: {
          jiraHost: $('#jira-host').val(),
          jiraPort: $('#jira-port').val(),
          jiraUser: $('#jira-user').val(),
          jiraPassword: $('#jira-password').val(),
          jiraProject: TT.Model.JiraProject.get({ name: jiraProject }).key,
          pivotalProject: TT.Model.Project.get({ name: pivotalProject }).id
        }
      });
      TT.View.message('Importing started! We will keep you updated on the progress of the import.', 'success');
      TT.Dialog.close();
    }

    return false;
  };

  return pub;

}());
