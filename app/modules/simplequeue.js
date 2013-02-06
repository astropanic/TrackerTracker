var queue = {};
var finishFunction = {};

function add(type) {
  return function () {
    var args = Array.prototype.slice.call(arguments, 0);
    var id = args.shift();
    queue[id] = queue[id] || [];
    queue[id][type](args);
  };
}

exports.push = add('push');
exports.unshift = add('unshift');

exports.next = function (id) {
  queue[id] = queue[id] || [];
  if (queue[id].length > 0) {
    var current_args = queue[id].shift();
    var current_fn = current_args.shift();
    current_fn.apply(this, current_args);
  } else {
    if (finishFunction[id]) {
      finishFunction[id]();
    }
  }
};

exports.onFinish = function (id, callback) {
  finishFunction[id] = callback;
};
