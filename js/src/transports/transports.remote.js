Kaare.transports.Remote = function (options) {
    let _url = options.url || 'http://localhost:7379',
        _curKey = options.curKey || 'client.default',
        _remoteKey = options.remoteKey || 'server.default',
        _handlers = {},
        _communicator = new Kaare.transports.Remote.RedisCommunicator(_url)

    console.info(`Handlers initialized for ${_curKey}`)

    _communicator.subscribe(_curKey).subscribe(data => {
        if (data.cmd)
            _onCommand(data)
        else
            _onCallback(data)
    }, error => {
        console.error(`Communicator has failed: ${error}`)
    })

    this.executeCommand = (cmd, params) => {
        return Rx.Observable.create(observer => {
            let opId = _genUuid()
            console.info(`Added handler for ${opId}.${_curKey}`)
            _handlers[opId] = observer
            _communicator.publish(_remoteKey, {
                opId, cmd, params
            })
        })
    }

    this.stopReceiving = () => _communicator.unsubscribe()

    var _onCommand = (data) => {
        let op = this.onIncomingCommand(data.cmd, data.params)
        op.subscribe(value => {
                _communicator.publish(_remoteKey, {
                    opId: data.opId,
                    type: 'next',
                    data: value
                })
            },
            error => _communicator.publish(_remoteKey, {
                opId: data.opId,
                type: 'error',
                data: error
            }), () => _communicator.publish(_remoteKey, {
                opId: data.opId,
                type: 'completed'
            }))
    }

    var _onCallback = (data) => {
        let observer = _handlers[data.opId],
            type = data.type
        if (!observer) {
            console.error(`Handler for operation ${data.opId} cannot be found`)
            return;
        }

        if (type === 'next')
            observer.onNext(data.data)
        else {
            if (type === 'error')
                observer.onError(data.data)
            else if (type === 'completed')
                observer.onCompleted()
            else
                observer.onError(new Error(`Unexpected callback type ${type}`))

            delete _handlers[data.opId]
            console.info(`Handler removed for ${data.opId}.${_curKey}`)
        }
    }

    var _genUuid = () => { // Implementation from here: http://stackoverflow.com/a/2117523
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8) //jshint ignore:line
            return v.toString(16)
        })
    }
}
