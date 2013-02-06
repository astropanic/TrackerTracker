var TT = TT || {};
TT.Importer = (function () {
  var pub = {};

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
          TT.View.message('<strong>No projects found!</strong> Did you enter the wrong credentials?', { type: 'error' });
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
        },
        callback: function (data) {
          window.console.log('/importProject response', data);
          startTrackingImport(data.id);
          pub.pollForResults(data.id);
        }
      });
      TT.Dialog.close();
    }

    return false;
  };

  pub.pollForResults = function (id) {
    var note = '';
    var message = TT.View.message(note, { timeout: false, type: 'import' });

    var interval = setInterval(function () {
      TT.Ajax.get('/getImportLog', {
        data: { id: id },
        callback: function (data) {
          var seconds = Math.round((new Date().getTime() - data.startedAt) / 1000);
          data = $.extend({
            storyImportSuccesses: 0,
            commentImportSuccesses: 0,
            attachmentImportSuccesses: 0,
            totalIssues: 0,
            commentsFound: 0,
            attachmentsFound: 0
          }, data);
          data = $.extend(data, {
            progress: data.finishedAt ? 'Finished in ' + seconds + ' seconds.' : seconds + ' seconds elapsed.',
            storiesPercent: Math.ceil(100 * (data.storyImportSuccesses / data.totalIssues)),
            commentsPercent: Math.ceil(100 * (data.commentImportSuccesses / data.commentsFound)),
            attachmentsPercent: Math.ceil(100 * (data.attachmentImportSuccesses / data.attachmentsFound))
          });

          var html = TT.View.render('importProgress', data);
          message.find('.text').html(html);

          if (data.finishedAt) {
            clearInterval(interval);
            stopTrackingImport(id);
          }
        }
      });
    }, 1000);

    message.click(function () {
      clearInterval(interval);
      stopTrackingImport(id);
    });
  };

  var startTrackingImport = function (id) {
    var activeImports = TT.Utils.localStorage('activeImports');
    activeImports = activeImports ? JSON.parse(activeImports) : {};
    activeImports[id] = true;
    TT.Utils.localStorage('activeImports', activeImports);
  };

  var stopTrackingImport = function (id) {
    var activeImports = TT.Utils.localStorage('activeImports');
    activeImports = activeImports ? JSON.parse(activeImports) : {};
    if (activeImports[id]) {
      delete activeImports[id];
    }
    TT.Utils.localStorage('activeImports', activeImports);
  };

  pub.init = function () {
    var activeImports = TT.Utils.localStorage('activeImports');
    $.each(activeImports ? JSON.parse(activeImports) : {}, function (id, val) {
      window.console.log(id, val);
      if (id) {
        pub.pollForResults(id);
      }
    });
  };

  return pub;

}());
