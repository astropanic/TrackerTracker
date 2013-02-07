// Modal dialog

var TT = TT || {};
TT.Dialog = (function () {

  var pub = {};

  pub.open = function (content, options) {
    pub.close(function () {
      var html = TT.View.render('modalDialog', { content: content });
      var element = TT.View.attach(html, 'body');

      if (options) {
        if (options.width) {
          element.find('.container').css({ width: options.width, marginLeft: (options.width / 2) * -1 });
        }
        if (options.minHeight) {
          element.find('.container').css({ minHeight: options.minHeight });
        }
      }
    });
  };

  pub.close = function (callback) {
    $('.modal-dialog, .modal-dialog-overlay').remove();
    if (TT.Utils.isFunction(callback)) {
      callback();
    }

    return false;
  };

  return pub;

}());
