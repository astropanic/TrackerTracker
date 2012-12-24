// Modal dialog

TT.Dialog = (function () {

  var pub = {};

  pub.open = function (content) {
    pub.close(function () {
      TT.View.drawModalDialog(content);
    });
  };

  pub.close = function (callback) {
    callback = callback || TT.noop;
    if (pub.dialog) {
      pub.dialog.find('.modal-dialog, .modal-dialog-overlay').fadeOut(180);
      setTimeout(function () {
        pub.dialog.empty().remove();
        pub.dialog = null;
        callback();
      }, 200);
    } else {
      callback();
    }
  };

  return pub;

}());
