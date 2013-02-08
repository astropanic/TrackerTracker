var TT = TT || {};
TT.Charts = (function () {
  var pub = {};

  var currentData = {};
  var currentVelocity = 5;

  pub.compileProjectionChartData = function (project, velocity) {
    var stories = TT.Model.Story.find({ project_id: project.id, current_state: 'unstarted' });

    var output = {
      projectName: project.name,
      weeks: parseInt(project.iteration_length, 10),
      velocity: Math.max(velocity || project.current_velocity, 5),
      columns: stories.length,
      labels: [],
      stories: []
    };

    $.each(stories, function (index, story) {
      var labels = story.labels.length > 0 ? story.labels : ['unlabeled'];
      $.each(labels, function (labelIndex, label) {
        if ($.inArray(label, output.labels) === -1) {
          output.labels[output.labels.length] = label;
        }
        output.stories[output.stories.length] = {
          index: output.stories.length,
          id: story.id,
          iteration: story.current_iteration,
          column: index + 1,
          row: output.labels.indexOf(label),
          formatted_name: story.formatted_name,
          estimate: story.estimate,
          project_name: project.name,
          story_type: story.story_type,
          owner: story.owned_by || 'nobody',
          requester: story.requested_by,
          labels: story.labels
        };
      });
    });

    output.rows = output.labels.length;

    return output;
  };

  pub.drawProjectionChart = function (data) {
    var chartLayout = TT.View.render('projectionChartLayout', {
      velocity: data.velocity,
      projectName: data.projectName
    });
    TT.Dialog.open(chartLayout, { fullscreen: true });

    var id;
    $('.velocity-input').keyup(function () {
      clearTimeout(id);
      data.velocity = $(this).val();
      id = setTimeout(function () {
        pub.redrawProjectionChart(data);
      }, 200);
      return false;
    });

    pub.redrawProjectionChart(data);
  };

  pub.redrawProjectionChart = function (data) {
    $('.projection-chart .labels-container, .projection-chart .data-container').remove();
    pub.drawTableCanvas(data);
    pub.addStoriesToChart(data);
  };

  pub.drawTableCanvas = function (data) {
    var row, col, odd, lastCell;

    var html = '<div class="labels-container"><table class="labels" border="0" cellspacing="0" cellpadding="0">';
    $.each(data.labels, function (index, label) {
      html += '<tr><td class="row-label">' + label + '</td></tr>';
    });
    html += '</table></div>';
    html += '<div class="data-container"><table class="data" border="0" cellspacing="0" cellpadding="0">';
    for (row = 0; row < data.rows; row++) {
      odd = row % 2 ? 'even' : 'odd';
      html += '<tr class="row row-' + row + ' ' + odd + '">';
      for (col = 1; col <= data.columns; col++) {
        lastCell = col === data.columns ? ' last-cell' : '';
        html += '<td class="cell cell-' + col + lastCell + '"></td>';
      }
      html += '</tr>';
    }
    html += '</table></div>';

    $(html).appendTo('.projection-chart');
  };

  pub.addStoriesToChart = function (data) {
    var $chart = $('.projection-chart table.data');
    var points = 0;
    var last_column = 0;
    var iteration_counter = 0;
    $.each(data.stories, function (index, story) {
      if (last_column !== story.column) {
        last_column = story.column;
        points += parseInt(story.estimate || 0, 10);
        if (points >= data.velocity) {
          points -= data.velocity;
          var marker = TT.View.render('iterationMarker', {
            date: pub.getIterationDate(data.weeks + iteration_counter)
          });
          iteration_counter += 1;
          var markerTarget = $chart.find('tr.row-0 td.cell-' + story.column);
          $(marker).appendTo(markerTarget);
          $chart.find('td.cell-' + story.column).addClass('iteration');
        }
      }

      if (story.story_type === 'release') {
        $chart.find('td.cell-' + story.column).addClass('release-column');
      }
      var target = $chart.find('tr.row-' + story.row + ' td.cell-' + story.column);
      TT.View.attach(TT.View.render('projectionChartCell', story), target).css({ width: (story.estimate * 12) + 12 });
    });
  };

  pub.getIterationDate = function (weeks) {
    var d = new Date();
    d.setDate(d.getDate() + (7 * weeks));

    return (d.getMonth() + 1) + '/' + d.getDate();
  };

  pub.makeProjectionChart = function (project, velocity) {
    if (!project || !project.name) {
      var lastSelected = TT.Model.Project.get({ name: TT.Utils.localStorage('lastChartSelected') });
      project = lastSelected || TT.Model.Project.get()[0];
    }
    var data = pub.compileProjectionChartData(project, velocity);
    currentData = data;
    currentVelocity = velocity;
    pub.drawProjectionChart(data);

    return false;
  };

  pub.openProjectSelector = function () {
    var items = [];

    TT.Model.Project.each(function (index, project) {
      items[items.length] = {
        name: '<strong>' + project.name + '</strong> (' + project.id + ')',
        value: project.name
      };
    });

    TT.Autocomplete.open({
      items: items,
      target: this,
      css: { width: 300 },
      noActive: true,
      onApply: function (projectName) {
        TT.Utils.localStorage('lastChartSelected', projectName);
        var project = TT.Model.Project.get({ name: projectName });
        pub.makeProjectionChart(project);
        return false;
      }
    });

    return false;
  };

  pub.showStoryCellDetails = function () {
    var index = $(this).data('index');
    var html = TT.View.render('projectionChartStoryDetail', currentData.stories[index]);
    TT.Tooltip.open({ target: this, html: html });
  };

  return pub;

}());
