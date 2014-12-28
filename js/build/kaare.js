"use strict";
var Kaare = function() {
  var transport = arguments[0] !== (void 0) ? arguments[0] : new Kaare.transports.Native();
  var _localCommands = {},
      _transport = transport;
  _transport.onIncomingCommand = (function(cmd, params) {
    if (cmd in _localCommands) {
      var handler = _localCommands[cmd],
          handlerResult;
      try {
        handlerResult = handler(params);
      } catch (ex) {
        return Rx.Observable.throw(ex);
      }
      return handlerResult;
    }
    return Rx.Observable.throw(new Error(("Command " + cmd + " cannot be found")));
  });
  this.executeCommand = (function(cmd, params) {
    return (_transport.executeCommand(cmd, params));
  });
  this.registerCommand = (function(cmd, handler) {
    if (cmd in _localCommands)
      throw new Error(("Kaare already contains a command with name " + cmd + ". Consider using different name"));
    _localCommands[cmd] = handler;
  });
  this.transport = _transport;
};
Kaare.transports = {};

"use strict";
Kaare.transports.Native = function() {
  var $__0 = this;
  var SYNC_MAX_RETRY = 10;
  var _syncObject;
  ['name', 'message'].forEach((function(prop) {
    Object.defineProperty(Error.prototype, prop, {
      enumerable: true,
      configurable: true,
      writable: true
    });
  }));
  Rx.Observable.create((function(observer) {
    if (typeof __kaareTransportNativeSyncObject === 'undefined') {
      void 0;
      setTimeout((function() {
        return observer.onError(new Error('Synchronization object cannot be found. Check that other side is ready'));
      }), 1000);
    } else {
      observer.onNext(__kaareTransportNativeSyncObject);
      observer.onCompleted();
    }
  })).retry(SYNC_MAX_RETRY).subscribe((function(v) {
    _syncObject = v;
    _syncObject.execJS = $__0.onIncomingCommand;
  }), (function(err) {
    return void 0;
  }));
  this.executeCommand = (function(cmd, params) {
    return Rx.Observable.create((function(observer) {
      if (!_syncObject) {
        setTimeout((function() {
          return observer.onError(new Error('Synchronization object cannot be found. Check that other side is ready'));
        }), 1000);
      } else
        _syncObject.execNative(cmd, params, (function(value) {
          return observer.onNext(value);
        }), (function(err) {
          return observer.onError(err);
        }), (function() {
          return observer.onCompleted();
        }));
    })).retry(SYNC_MAX_RETRY);
  });
  this.stopReceiving = (function() {
    return _syncObject.execJS = null;
  });
};

"use strict";
Kaare.transports.Remote = function(options) {
  var $__0 = this;
  var _url = options && options.url || 'http://localhost:7379',
      _curKey = options && options.curKey || 'client.default',
      _remoteKey = options && options.remoteKey || 'server.default',
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
  this.executeCommand = (function(cmd, params) {
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
  this.stopReceiving = (function() {
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
  var DATA_TYPE = '__kType',
      TYPE_ERROR = 'Error';
  var _url = url,
      _req,
      _key;
  this.publish = (function(key, msg) {
    var $__1;
    void 0;
    var req = new XMLHttpRequest(),
        serData;
    if (msg.data instanceof Error) {
      msg.data = ($__1 = {}, Object.defineProperty($__1, "name", {
        value: msg.data.name,
        configurable: true,
        enumerable: true,
        writable: true
      }), Object.defineProperty($__1, "message", {
        value: msg.data.message,
        configurable: true,
        enumerable: true,
        writable: true
      }), Object.defineProperty($__1, "stack", {
        value: msg.data.stack,
        configurable: true,
        enumerable: true,
        writable: true
      }), Object.defineProperty($__1, DATA_TYPE, {
        value: TYPE_ERROR,
        configurable: true,
        enumerable: true,
        writable: true
      }), $__1);
    }
    void 0;
    serData = btoa(JSON.stringify(msg));
    if (serData.length > 200000)
      throw new Error('Currently remote transport does not support messages with a size bigger than 200kb');
    req.open('POST', _url, false);
    req.onreadystatechange = (function() {
      if (req.responseText === '{"PUBLISH":0}')
        void 0;
    });
    req.send(("PUBLISH/" + key + "/" + serData));
  });
  this.subscribe = (function(key) {
    var prevRespLength = 0,
        prevMsgPart;
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
          if (prevMsgPart) {
            msg = prevMsgPart + msg;
            prevMsgPart = null;
          }
          try {
            parsedData = JSON.parse(msg);
          } catch (ex) {
            prevMsgPart = msg;
            return;
          }
          try {
            msg = parsedData.SUBSCRIBE.pop();
            parsedData = msg !== 1 ? JSON.parse(atob(msg)) : 1;
            if (parsedData.data && DATA_TYPE in parsedData.data)
              parsedData.data = processCustomType(parsedData.data);
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
      void 0;
    }
  });
  var processCustomType = function(data) {
    if (data[DATA_TYPE] !== TYPE_ERROR)
      throw new Error(("Not supportd custom type: " + data[DATA_TYPE]));
    var glob = (function() {
      return this;
    }).call(null),
        err;
    if (data.name in glob)
      err = new glob[data.name](data.message);
    else
      err = new Error(data.message);
    err.stack = data.stack;
    return err;
  };
};
