Kaare.transports.Remote = function(options) {
  var _url = options.url || 'http://localhost:7645'

  //TODO: Subscribe to execition channel
  //
  this.send = (cmd, params) => {
    return Rx.Observable.create(observer => {
      //TODO: Forward call
    })
  }
}
