var TT = TT || {};
TT.Ajax = (function () {

  var pub = {};
  var serverRequests = 0;
  var serverResponses = 0;
  var timeouts = [];

  // ajax UI state

  pub.start = function () {
    serverRequests++;
    $('body').addClass('ajaxRunning');
    timeouts[serverRequests] = setTimeout(pub.end, 10000);
  };

  pub.end = function () {
    serverResponses++;
    if (serverRequests === serverResponses) {
      $('body').removeClass('ajaxRunning');
    }
    clearTimeout(timeouts[serverResponses]);
  };

  return pub;

}());
