// Modal dialog

var TT = TT || {};
TT.Dialog = (function () {

  var pub = {};

  pub.open = function (content, options) {
    pub.close(function () {
      var html = TT.View.render('modalDialog', { content: content });
      var element = TT.View.attach(html, 'body');

      if (options && options.fullscreen) {
        $('.modal-dialog').addClass('modal-dialog-fullscreen').find('.container').css({
          width: $(window).width() - 100,
          height: $(window).height() - 100
        });
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
