TT.Ajax = (function () {

  var pub = {};
  var activeServerRequests = 0;

  // ajax UI state

  pub.start = function () {
    activeServerRequests++;
    $('body').addClass('ajaxRunning');
  };

  pub.end = function () {
    activeServerRequests--;
    if (!activeServerRequests) {
      $('body').removeClass('ajaxRunning');
    }
  };

  return pub;

}());
