// Modal dialog

var TT = TT || {};
TT.Dialog = (function () {

  var pub = {};

  var noop = function () { };

  pub.open = function (content) {
    pub.close(function () {
      TT.View.drawModalDialog(content);
    });
  };

  pub.close = function (callback) {
    callback = TT.Utils.isFunction(callback) ? callback : noop;
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
