var TT = TT || {};
TT.Autocomplete = (function () {

  var pub = {};

  pub.MAX_HEIGHT = 240;

  pub.target = null;

  pub.open = function (options) {
    pub.hasMouse = false;
    pub.closeOnLeave = false;

    pub.close();
    pub.target = $(options.target);
    pub.target.keyup(pub.onKeyUp).blur(function () {
      if (pub.hasMouse) {
        pub.closeOnLeave = true;
      } else {
        pub.close();
      }
    });

    var data = {
      className: options.className,
      items: options.items
    };

    var html = TT.View.render('autocomplete', data);
    TT.View.attach(html, 'body');

    pub.setPosition(options.css);
    pub.filter();

    $('#autocomplete').mouseenter(function () {
      pub.hasMouse = true;
    }).mouseleave(function () {
      if (pub.closeOnLeave) {
        pub.close();
      }
      pub.hasMouse = false;
    });
  };

  pub.filter = function () {
    var value = pub.target.val().toLowerCase();

    if (value) {
      $('#autocomplete .item').show().filter(function () {
        return $(this).data('value').toLowerCase().indexOf(value) === -1;
      }).hide();
    } else {
      $('#autocomplete .item').show();
    }

    pub.setActive();
  };

  pub.close = function () {
    $('#autocomplete').remove();
    if (pub.target) {
      pub.target.unbind('keyup blur');
      pub.target = null;
    }

    $('body').unbind('.TT.Autocomplete');

    return false;
  };

  function getNextElement(defaultFn, fallbackFn) {
    var element = $('#autocomplete .item.active')[defaultFn]('.item:visible').first();
    if (element.length === 0) {
      element = $('#autocomplete .item:visible')[fallbackFn]();
    }

    return element;
  }

  pub.onKeyUp = function (e) {
    if (TT.Utils.keyPressed(e, 'DOWN_ARROW')) {
      pub.setActive(getNextElement('nextAll', 'first'));
    } else if (TT.Utils.keyPressed(e, 'UP_ARROW')) {
      pub.setActive(getNextElement('prevAll', 'last'));
    } else if (TT.Utils.keyPressed(e, 'ENTER')) {
      pub.apply($('#autocomplete .item.active'));
    } else if (TT.Utils.keyPressed(e, 'ESCAPE')) {
      pub.close();
    } else {
      pub.filter();
    }
  };

  pub.setPosition = function (customCSS) {
    var offset = pub.target.offset();

    $('#autocomplete').css($.extend({
      maxHeight: pub.MAX_HEIGHT,
      left: offset.left,
      top: offset.top + pub.target.outerHeight() - 1,
      width: pub.target.outerWidth() - 2
    }, customCSS || {}));
  };

  pub.setActive = function (element) {
    element = element || $('#autocomplete .item:visible').first();
    $('#autocomplete .active').removeClass('active');
    $(element).addClass('active');

    pub.setScrollTop();
  };

  pub.setScrollTop = function () {
    var active = $('#autocomplete .active');
    var top = 0;

    if (active.length) {
      var index = 0;
      var offset = Math.round(($('#autocomplete').outerHeight() / active.outerHeight()) / 2);

      $('#autocomplete .item:visible').filter(function (i) {
        if ($(this).hasClass('active')) {
          index = i;
        }
      });
      top = $('#autocomplete .active').outerHeight() * (index - offset);
    }

    $('#autocomplete').scrollTop(top);
  };

  pub.apply = function (element) {
    pub.clicked = new Date().getTime();
    element = element || this;
    pub.target.val($(element).data('value')).blur();
    pub.close();

    return false;
  };

  return pub;

}());
