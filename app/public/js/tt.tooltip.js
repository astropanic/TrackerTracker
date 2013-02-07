var TT = TT || {};
TT.Tooltip = (function () {

  var pub = {};

  var self = {
    active: false,
    tooltip: null,
    target: null
  };

  function setPosition() {
    var offset = self.target.offset();
    var left = offset.left + (self.target.outerWidth() / 2) - (self.tooltip.outerWidth() / 2);
    var top = offset.top - self.target.outerHeight() - self.tooltip.outerHeight();

    self.tooltip.css({
      left: Math.max(10, Math.min($(window).width() - 10 - self.tooltip.outerWidth(), left)),
      top: Math.max(10, Math.min($(window).height() - 10 - self.tooltip.outerHeight(), top))
    });

    self.tooltip.find('.tooltip-arrow').css({
      left: (self.tooltip.outerWidth() / 2) - 9
    });

    self.tooltip.hide().fadeIn(60);
  }

  function setClosingBoundaries() {
    var bounds = self.target.offset();
    bounds.right = bounds.left + self.target.outerWidth();
    bounds.bottom = bounds.top + self.target.outerHeight();

    $('body').bind('mousemove.Tooltip', function (e) {
      if (e.pageX < bounds.left || e.pageX > bounds.right || e.pageY < bounds.top || e.pageY > bounds.bottom) {
        $('body').unbind('.Tooltip');
        self.tooltip.fadeOut(100, function () {
          self.tooltip.remove();
          self.active = false;
          self.tooltip = null;
        });
      }
    });
  }

  pub.isActive = function () {
    return self.active;
  };

  pub.open = function (options) {
    if (!self.active) {
      self.active = true;
      self.target = $(options.target);
      self.tooltip = TT.View.attach(TT.View.render('tooltip', { html: options.html }), 'body');

      setPosition();
      setClosingBoundaries();
    }
  };

  return pub;

}());
