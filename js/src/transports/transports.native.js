Kaare.transports.Native = function () {
  const SYNC_MAX_RETRY = 10

  this.send = (cmd, params) => {
    return Rx.Observable.create(observer => {
      if (typeof __kaareTransportNativeSyncObject === 'undefined')
      {
        console.log('Sync object not found, wait for 1 second...')
        setTimeout(() => observer.onError(new Error('Synchronization object cannot be found. Check that other side is ready')), 1000)
      }
      else
        __kaareTransportNativeSyncObject.bridge(cmd,
                                                params,
                                                value => observer.onNext(value),
                                                err => observer.onError(err), 
                                                () => observer.onCompleted())
    }).retry(SYNC_MAX_RETRY)
  }
}
