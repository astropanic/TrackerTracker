var queue = [];
var isRunning = false;

exports.push = function () {
  queue.push(Array.prototype.slice.call(arguments, 0));
};

exports.unshift = function () {
  queue.unshift(Array.prototype.slice.call(arguments, 0));
};

exports.run = function () {
  if (queue.length > 0) {
    isRunning = true;
    var current_args = queue.shift();
    var current_fn = current_args.shift();
    current_fn.apply(this, current_args);
  }
};

exports.next = function () {
  if (queue.length > 0) {
    exports.run();
  } else {
    isRunning = false;
    exports.finished();
  }
};

exports.finished = function () {};
