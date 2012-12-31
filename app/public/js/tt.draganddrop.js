var TT = TT || {};
TT.DragAndDrop = (function () {

  var pub = {};
  var dragOutFn, dragInFn, columnOut, columnIn;

  pub.getDragFn = function (element, type) {
    var fn;
    element = $(element).closest('.column');

    TT.Model.Column.each(function (index, column) {
      if (element.hasClass(column.class_name)) {
        if (type === 'in' && column.onDragIn) {
          fn = column.onDragIn;
        } else if (type === 'out' && column.onDragOut) {
          fn = column.onDragOut;
        }
      }
    });

    return fn;
  };

  pub.onStoryStart = function (event, ui) {
    columnOut = $(ui.item).closest('.column')[0];
    dragOutFn = pub.getDragFn(ui.item, 'out');
  };

  pub.onStoryBeforeStop = function (event, ui) {
    columnIn = $(ui.item).closest('.column')[0];
    if (columnOut === columnIn) {
      return true;
    }

    var story = TT.Model.Story.get({ id: $(ui.item).data('story-id') });
    var data = {};

    dragInFn = pub.getDragFn(ui.item, 'in');

    if (dragOutFn) {
      $.extend(data, dragOutFn(story));
    }
    if (dragInFn) {
      $.extend(data, dragInFn(story));
    }

    if (dragOutFn || dragInFn) {
      TT.Model.Story.update({ id: story.id }, data);
      TT.Model.Story.serverSave(story, data);
    }
  };

  pub.onStoryStop = function () {
    if (dragOutFn || dragInFn) {
      // wait for jQuery sortable to finish up
      TT.View.drawStories();
    }
    dragOutFn = dragInFn = null;
  };

  pub.initStorySorting = function () {
    $('.sortable-column').sortable({
      cancel: '.expanded-story',
      connectWith: '.sortable-column',
      containment: '#content',
      distance: 10,
      tolerance: 'pointer',
      start: pub.onStoryStart,
      beforeStop: pub.onStoryBeforeStop,
      stop: pub.onStoryStop
    });
  };

  pub.layoutSortUpdate = function (element) {
    var name = element.data('column-name');
    var column = TT.Model.Layout.get({ name: name });
    var oldIndex = TT.Model.Layout.index({ name: name });
    var newIndex = oldIndex + (column.indexStop - column.indexStart);

    TT.Model.Layout.move(oldIndex, newIndex);
  };

  pub.init = function () {
    pub.initStorySorting();

    /*
    $('#filters').sortable({
      distance: 10,
      tolerance: 'pointer'
    });
    */

    $('#columns').sortable({
      distance: 10,
      handle: '.column-title',
      tolerance: 'pointer',
      start: function (event, ui) {
        ui.placeholder.width(ui.helper.width() - 4);
        var name = ui.item.data('column-name');
        TT.Model.Layout.update({ name: name }, { indexStart: ui.item.index() });
      },
      stop: function (event, ui) {
        var name = ui.item.data('column-name');
        TT.Model.Layout.update({ name: name }, { indexStop: ui.item.index() });
        pub.layoutSortUpdate(ui.item);
        TT.View.refreshLayout();
      }
    });
  };

  return pub;

}());
