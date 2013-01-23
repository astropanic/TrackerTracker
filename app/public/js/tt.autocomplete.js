var TT = TT || {};
TT.Autocomplete = (function () {

  var pub = {};

  pub.defaults = {
    closeOnApply: true,
    maxHeight: 240
  };
  pub.options = {};

  pub.target = null;
  pub.input = null;
  pub.hasMouse = false;
  pub.closeOnLeave = false;

  pub.onInputBlur = function () {
    if (pub.hasMouse) {
      pub.closeOnLeave = true;
    } else {
      pub.close();
    }
  };

  pub.open = function (options) {
    pub.close();

    pub.options = $.extend({}, pub.defaults, options);

    pub.hasMouse = false;
    pub.closeOnLeave = false;

    var data = {
      className: options.className,
      items: options.items
    };

    var html = TT.View.render('autocomplete', data);
    TT.View.attach(html, 'body');

    pub.target = $(options.target);

    if (options.showInput) {
      pub.input = $('#autocomplete-input').show().focus();
      if (options.value) {
        pub.input.val(options.value);
      }
    } else {
      if (options.noActive) {
        $('#autocomplete-input').show().css({ position: 'absolute', top: '-9999px' }).focus().blur(pub.onInputBlur);
      }
      pub.input = pub.target;
    }

    if (!options.noActive) {
      var inputVal = pub.input.val();
      var active = $('#autocomplete .item').filter(function () {
        return $(this).data('value') === inputVal || $(this).text() === inputVal;
      });
      if (active.length) {
        pub.setActive(active);
      } else {
        pub.setActive();
      }
    }

    pub.input.keyup(pub.onKeyUp).blur(pub.onInputBlur);

    pub.setPosition(options.css);
    pub.setScrollTop();

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
    var value = pub.input.val().toLowerCase();

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
    if (pub.input) {
      pub.input.unbind('keyup blur');
      pub.input = null;
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
      pub.input.val($('#autocomplete .active').data('value'));
    } else if (TT.Utils.keyPressed(e, 'UP_ARROW')) {
      pub.setActive(getNextElement('prevAll', 'last'));
      pub.input.val($('#autocomplete .active').data('value'));
    } else if (TT.Utils.keyPressed(e, 'RIGHT_ARROW')) {
      pub.input.val($('#autocomplete .active').data('value'));
    } else if (TT.Utils.keyPressed(e, 'ENTER')) {
      var active = $('#autocomplete .item.active');
      pub.applyValue(active.length ? active : pub.input);
    } else if (TT.Utils.keyPressed(e, 'ESCAPE')) {
      pub.close();
    } else {
      pub.filter();
    }
  };

  pub.setPosition = function (customCSS) {
    var $autocomplete = $('#autocomplete');
    var offset = pub.target.offset();

    $autocomplete.css($.extend({
      left: offset.left,
      top: offset.top + pub.target.outerHeight() - 1,
      width: pub.target.outerWidth() - 2
    }, customCSS || {}));

    $autocomplete.find('.list').css({ maxHeight: pub.options.maxHeight });

    $('#autocomplete-input').css({
      width: $('#autocomplete').outerWidth() - 22
    });

    $autocomplete.css({
      left: Math.min($autocomplete.offset().left, $(window).width() - $autocomplete.outerWidth() - 3),
      top: Math.min($autocomplete.offset().top, $(window).height() - $autocomplete.outerHeight() - 3)
    });
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
      var offset = Math.round(($('#autocomplete .list').outerHeight() / active.outerHeight()) / 2);

      $('#autocomplete .item:visible').filter(function (i) {
        if ($(this).hasClass('active')) {
          index = i;
        }
      });
      top = $('#autocomplete .active').outerHeight() * (index - offset);
    }

    $('#autocomplete .list').scrollTop(top);
  };

  pub.applyValue = function (element) {
    element = TT.Utils.isDomElement(element) ? element : this;

    var value = $(element).data('value');
    if (value) {
      pub.input.val(value);
    }
    value = pub.input.val();

    if (pub.options.onApply) {
      pub.options.onApply.call(element, value);
    }

    if (pub.options.closeOnApply) {
      pub.close();
    }

    return false;
  };

  return pub;

}());
