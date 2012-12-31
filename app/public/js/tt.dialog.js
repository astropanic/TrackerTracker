// Modal dialog

var TT = TT || {};
TT.Dialog = (function () {

  var pub = {};

  pub.open = function (content) {
    pub.close(function () {
      TT.View.drawModalDialog(content);
    });
  };

  pub.close = function (callback) {
    $('.modal-dialog, .modal-dialog-overlay').empty().remove();
    if (TT.Utils.isFunction(callback)) {
      callback();
    }
  };

  return pub;

}());
