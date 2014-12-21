// PhantomJS is missing it
// Took from https://github.com/ariya/phantomjs/issues/10522#issuecomment-39248521

var isFunction = function(o) {
  return typeof o == 'function';
};


var bind,
  slice = [].slice,
  proto = Function.prototype,
  featureMap;

featureMap = {
  'function-bind': 'bind'
};

function has(feature) {
  var prop = featureMap[feature];
  return isFunction(proto[prop]);
}

// check for missing features
if (!has('function-bind')) {
  // adapted from Mozilla Developer Network example at
  // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
  bind = function bind(obj) {
    var args = slice.call(arguments, 1),
      self = this,
      nop = function() {
      },
      bound = function() {
        return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));
      };
    nop.prototype = this.prototype || {}; // Firefox cries sometimes if prototype is undefined
    bound.prototype = new nop();
    return bound;
  };
  proto.bind = bind;
}


/* For detailed credits and licence information see http://github.com/financial-times/polyfill-service.
 * 
 * Detected: chrome/39.0.2171
 * 
 * - Promise, License: CC0  */
this.Promise = function Promise(resolver) {
  var
  self = this,
  then = self.then = function () {
    return Promise.prototype.then.apply(self, arguments);
  };

  then.fulfilled = [];
  then.rejected = [];

  function timeout(state, object) {
    then.state = 'pending';

    if (then[state].length) setTimeout(function () {
      timeout(state, then.value = then[state].shift().call(self, object));
    }, 0);
    else then.state = state;
  }

  then.fulfill = function (object) {
    timeout('fulfilled', object);
  };

  then.reject = function (object) {
    timeout('rejected', object);
  };

  resolver.call(self, then.fulfill, then.reject);

  return self;
};

Promise.prototype = {
  'constructor': Promise,
  'then': function (onFulfilled, onRejected) {
    if (onFulfilled) this.then.fulfilled.push(onFulfilled);
    if (onRejected) this.then.rejected.push(onRejected);

    if (this.then.state === 'fulfilled') this.then.fulfill(this.then.value);

    return this;
  },
  'catch': function (onRejected) {
    if (onRejected) this.then.rejected.push(onRejected);

    return this;
  }
};

Promise.all = function () {
  var
  args = Array.prototype.slice.call(arguments),
  countdown = args.length;

  function process(promise, fulfill, reject) {
    promise.then(function onfulfilled(value) {
      if (promise.then.fulfilled.length > 1) promise.then(onfulfilled);
      else if (!--countdown) fulfill(value);

      return value;
    }, function (value) {
      reject(value);
    });
  }

  return new Promise(function (fulfill, reject) {
    while (args.length) process(args.shift(), fulfill, reject);
  });
};