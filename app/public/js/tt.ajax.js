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
    timeouts[serverRequests] = setTimeout(pub.timeout, 10000);
  };

  pub.end = function () {
    serverResponses++;
    if (serverRequests === serverResponses) {
      $('body').removeClass('ajaxRunning');
    }
    clearTimeout(timeouts[serverResponses]);
  };

  pub.timeout = function () {
    TT.View.message('Giving up waiting for response from server.', { type: 'error' });
    pub.end();
  };

  pub.ajax = function (type, url, options) {
    pub.start();
    $.ajax({
      url: url,
      type: type,
      data: options.data,
      success: function (response) {
        if (options.callback) {
          options.callback(response);
        }
      },
      complete: pub.end
    });
  };

  pub.get = function (url, options) {
    pub.ajax('GET', url, options);
  };

  pub.post = function (url, options) {
    pub.ajax('POST', url, options);
  };

  return pub;

}());
