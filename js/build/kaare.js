"use strict";
var Kaare = function(transport) {
  var $__0 = this;
  this.transport = transport || new Kaare.transports.Native();
  this.transport.onIncomingCommand = (function(cmd, params) {
    var retVal = _getCommandResult(cmd, params);
    if (retVal instanceof Rx.Observable)
      return retVal;
    else
      return new Rx.Observable.return(retVal);
  });
  this.executeCommand = (function(cmd, params) {
    return ($__0.transport.send(cmd, params));
  });
  var _getCommandResult = (function(cmd, params) {
    var func,
        err;
    try {
      func = eval.call(null, cmd);
    } catch (e) {
      err = e;
    }
    if (err)
      return Rx.Observable.throw(new Error(("Command " + cmd + " returned exception " + err)));
    if (!func)
      return Rx.Observable.throw(new Error(("Command " + cmd + " cannot be found")));
    if (typeof func === 'function')
      return func.apply(null, params);
    if (func instanceof Rx.Observable)
      return func;
    else
      return Rx.Observable.return(func);
  });
};
Kaare.transports = {};

"use strict";
Kaare.transports.Native = function() {
  var SYNC_MAX_RETRY = 10;
  this.send = (function(cmd, params) {
    return Rx.Observable.create((function(observer) {
      if (typeof __kaareTransportNativeSyncObject === 'undefined') {
        void 0;
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
  var $__0 = this;
  var _url = options.url || 'http://localhost:7379',
      _curKey = options.curKey || 'client.default',
      _remoteKey = options.remoteKey || 'server.default',
      _handlers = {},
      _communicator = new Kaare.transports.Remote.RedisCommunicator(_url);
  void 0;
  _communicator.subscribe(_curKey).subscribe((function(data) {
    if (data.cmd)
      _onCommand(data);
    else
      _onCallback(data);
  }), (function(error) {
    void 0;
  }));
  this.send = (function(cmd, params) {
    return Rx.Observable.create((function(observer) {
      var opId = _genUuid();
      void 0;
      _handlers[opId] = observer;
      _communicator.publish(_remoteKey, {
        opId: opId,
        cmd: cmd,
        params: params
      });
    }));
  });
  this.stop = (function() {
    return _communicator.unsubscribe();
  });
  var _onCommand = (function(data) {
    var op = $__0.onIncomingCommand(data.cmd, data.params);
    op.subscribe((function(value) {
      _communicator.publish(_remoteKey, {
        opId: data.opId,
        type: 'next',
        data: value
      });
    }), (function(error) {
      return _communicator.publish(_remoteKey, {
        opId: data.opId,
        type: 'error',
        data: error
      });
    }), (function() {
      return _communicator.publish(_remoteKey, {
        opId: data.opId,
        type: 'completed'
      });
    }));
  });
  var _onCallback = (function(data) {
    var observer = _handlers[data.opId],
        type = data.type;
    if (!observer) {
      void 0;
      return;
    }
    if (type === 'next')
      observer.onNext(data.data);
    else {
      if (type === 'error')
        observer.onError(data.data);
      else if (type === 'completed')
        observer.onCompleted();
      else
        observer.onError(new Error(("Unexpected callback type " + type)));
      delete _handlers[data.opId];
      void 0;
    }
  });
  var _genUuid = (function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (function(c) {
      var r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }));
  });
};

"use strict";
Kaare.transports.Remote.RedisCommunicator = function(url) {
  var $__0 = this;
  var _url = url,
      _req,
      _key,
      _isAborted;
  this.publish = (function(key, msg) {
    void 0;
    var req = new XMLHttpRequest(),
        serData;
    if (_isAborted)
      msg = {'ABORT': 'ABORT'};
    if (msg.data instanceof Error)
      msg.data = JSON.stringify(msg.data, ['message', 'arguments', 'type', 'name']);
    void 0;
    serData = btoa(JSON.stringify(msg));
    req.open('GET', (_url + "/PUBLISH/" + key + "/" + serData), false);
    req.onreadystatechange = (function() {
      if (req.responseText === '{"PUBLISH":0}')
        void 0;
    });
    req.send();
  });
  this.subscribe = (function(key) {
    var prevRespLength = 0;
    _key = key;
    _req = new XMLHttpRequest();
    _req.open('GET', (_url + "/SUBSCRIBE/" + key), true);
    void 0;
    return new Rx.Observable.create((function(observer) {
      _req.onreadystatechange = (function() {
        if (_req.readyState !== 3)
          return;
        var response = _req.responseText,
            chunk = response.slice(prevRespLength),
            parsedData;
        prevRespLength = response.length;
        void 0;
        chunk.split(/(?={)/).forEach((function(msg) {
          try {
            parsedData = JSON.parse(msg);
            msg = parsedData.SUBSCRIBE.pop();
            parsedData = msg !== 1 ? JSON.parse(atob(msg)) : 1;
            void 0;
          } catch (ex) {
            void 0;
          }
          observer.onNext(parsedData);
        }));
      });
      _req.onerror = (function(err) {
        return observer.onError(err);
      });
      _req.send(null);
      return (function() {
        return $__0.unsubscribe();
      });
    })).skip(1);
  });
  this.unsubscribe = (function() {
    if (_req) {
      _req.abort();
      _isAborted = true;
      void 0;
    }
  });
};
