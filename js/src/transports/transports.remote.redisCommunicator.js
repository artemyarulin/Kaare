Kaare.transports.Remote.RedisCommunicator = function (url) {
    let _url = url,
        _req,
        _key,
        _isAborted

    /**
     * Publish message to redis
     * @param  {string} key Redis key to publish to
     * @param  {string|object} msg Object to send to redit. Would be serialized using Base64(JSON.stringify(msg))
     */
    this.publish = (key, msg) => {
        console.log('Publish', key, msg)
        let req = new XMLHttpRequest(),
            serData

        if (_isAborted)
            msg = {
                'ABORT': 'ABORT'
            }

        if (msg.data instanceof Error) // JSON.stringify doesn't work with errors
            msg.data = JSON.stringify(msg.data, ['message', 'arguments', 'type', 'name'])

        console.log(`Sending message: ` + JSON.stringify(msg))
        serData = btoa(JSON.stringify(msg))
        req.open('GET', `${_url}/PUBLISH/${key}/${serData}`, false)
        req.onreadystatechange = () => {
            if (req.responseText === '{"PUBLISH":0}')
                console.error(`There are no subscibers found for this message: ${serData}`)
        }
        req.send()
    }

    /**
     * Subscribes to Redis notifications
     * @param  {string} key Redis key to subscribe to
     * @return {Observable} Neverending observable which would contain message object
     */
    this.subscribe = (key) => {
        let prevRespLength = 0
        _key = key
        _req = new XMLHttpRequest()

        _req.open('GET', `${_url}/SUBSCRIBE/${key}`, true);
        console.info(`Redis subscriber ${key} started to listen`)

        return new Rx.Observable.create(observer => {
                _req.onreadystatechange = () => {
                    if (_req.readyState !== 3)
                        return

                    let response = _req.responseText,
                        chunk = response.slice(prevRespLength),
                        parsedData

                    prevRespLength = response.length

                    console.info(`Raw input ${chunk}`)
                    chunk.split(/(?={)/).forEach(msg => { // Sometimes chunk contains multiple messages like {"SUBSCRIBE":["message","[key]","[data]"]}
                        try {
                            parsedData = JSON.parse(msg)
                            msg = parsedData.SUBSCRIBE.pop()
                            parsedData = msg !== 1 ? JSON.parse(atob(msg)) : 1
                            console.info(`Incoming data ` + JSON.stringify(parsedData))
                        } catch (ex) {
                            console.error(`Failed to parse JSON data: ${chunk}. Error: ${ex}`)
                        }
                        observer.onNext(parsedData)
                    })
                }

                _req.onerror = (err) => observer.onError(err)
                _req.send(null)

                return () => this.unsubscribe()
            }).skip(1) // webdis (or Redis?) always returns first message {"SUBSCRIBE":["subscribe","[key]",1]}, so let's skip it
    }

    this.unsubscribe = () => {
        if (_req) {
            _req.abort()
            _isAborted = true
            console.info(`Redis communicator ${_key} stopped listening`)
        }
    }
}
