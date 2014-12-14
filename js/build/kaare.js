"use strict";
var Kaare = function(transport) {
  var _transport = transport || new Kaare.transports.Native();
  this.executeCommand = (function(cmd, params) {
    return (_transport.send(cmd, params));
  });
};
Kaare.transports = {};

"use strict";
Kaare.transports.Native = function() {
  var SYNC_MAX_RETRY = 10;
  this.send = (function(cmd, params) {
    return Rx.Observable.create((function(observer) {
      if (typeof __kaareTransportNativeSyncObject === 'undefined') {
        console.log('Sync object not found, wait for 1 second...');
        setTimeout((function() {
          return observer.onError(new Error('Synchronization object cannot be found. Check that other side is ready'));
        }), 1000);
      } else
        __kaareTransportNativeSyncObject.bridge(cmd, params, (function(value) {
          return observer.onNext(value);
        }), (function(err) {
          return observer.onError(err);
        }), (function() {
          return observer.onCompleted();
        }));
    })).retry(SYNC_MAX_RETRY);
  });
};

"use strict";
Kaare.transports.Remote = function(options) {
  var _url = options.url || 'http://localhost:7645';
  this.send = (function(cmd, params) {
    return Rx.Observable.create((function(observer) {}));
  });
};
