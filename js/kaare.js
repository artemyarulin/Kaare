Kaare = {}
Kaare.executeCommand = function (cmd, params) {
  return Rx.Observable.create(function (observer) {
    KaareNative.executeCommandNative(cmd, params, function (value) {
      observer.onNext(value);
    }, function (err) {
      observer.onError(err);
    }, function () {
      observer.onCompleted();
    })
  });
}

var splitStringByChar = function (str) {
  return Rx.Observable.create(function (observer) {
    str.split('').forEach(function (c) {
      observer.onNext(c);
    })
    observer.onCompleted();
  });
}

var callNativeSplit = function () {
  var out = ""

  Kaare.executeCommand('splitStringByChar', ['Hello']).subscribe(function (v) {
    out += v;
  }, function (err) {

  }, function () {
    if (out == "Hello")
    {
      done()
    }
    else
      log("Failed: " + out + '!=' + 'Hello')
  })
}
