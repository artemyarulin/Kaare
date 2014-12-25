Kaare.transports.Native = function () {
    const SYNC_MAX_RETRY = 10
    let _syncObject

    // By default Error object has no enumerable properties, which make very difficult to catch errors in JavaScriptCore
    ['name', 'message'].forEach(prop => {
        Object.defineProperty(Error.prototype, prop, {
            enumerable: true,
            configurable: true,
            writable: true
        })
    })

    Rx.Observable.create(observer => {
        if (typeof __kaareTransportNativeSyncObject === 'undefined') {
            console.log('Sync object not found, wait for 1 second...')
            setTimeout(() => observer.onError(new Error('Synchronization object cannot be found. Check that other side is ready')), 1000)
        } else {
            observer.onNext(__kaareTransportNativeSyncObject)
            observer.onCompleted()
        }
    }).retry(SYNC_MAX_RETRY).subscribe(
        (v) => {
            _syncObject = v
            _syncObject.execJS = this.onIncomingCommand
        }, (err) => console.error(`Native sync object cannot be found`))

    this.executeCommand = (cmd, params) => {
        return Rx.Observable.create(observer => {
            if (!_syncObject) {
                setTimeout(() => observer.onError(new Error('Synchronization object cannot be found. Check that other side is ready')), 1000)
            } else
                _syncObject.execNative(cmd,
                    params,
                    value => observer.onNext(value),
                    err => observer.onError(err), () => observer.onCompleted())
        }).retry(SYNC_MAX_RETRY)
    }

    this.stopReceiving = () => _syncObject.execJS = null
}
