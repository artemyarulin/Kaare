Kaare.transports.Remote.RedisCommunicator = function (url) {
    const DATA_TYPE = '__kType',
        TYPE_ERROR = 'Error'

    let _url = url,
        _req,
        _key

    /**
     * Publish message to redis
     * @param  {string} key Redis key to publish to
     * @param  {string|object} msg Object to send to redit. Would be serialized using Base64(JSON.stringify(msg))
     */
    this.publish = (key, msg) => {
        console.log('Publish', key, msg)
        let req = new XMLHttpRequest(),
            serData

        if (msg.data instanceof Error) { // JSON.stringify doesn't work with errors
            msg.data = {
                name: msg.data.name,
                message: msg.data.message,
                stack: msg.data.stack,
                [DATA_TYPE]: TYPE_ERROR
            }
        }

        console.log(`Sending message: ` + JSON.stringify(msg))
        serData = btoa(JSON.stringify(msg))
        if (serData.length > 200000)
            throw new Error('Currently remote transport does not support messages with a size bigger than 200kb')

        req.open('POST', _url, false)
        req.onreadystatechange = () => {
            if (req.responseText === '{"PUBLISH":0}')
                console.error(`There are no subscibers found for this message: ${serData}`)
        }
        req.send(`PUBLISH/${key}/${serData}`)
    }

    /**
     * Subscribes to Redis notifications
     * @param  {string} key Redis key to subscribe to
     * @return {Observable} Neverending observable which would contain message object
     */
    this.subscribe = (key) => {
        let prevRespLength = 0,
            prevMsgPart
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
                        if (prevMsgPart) {
                            msg = prevMsgPart + msg
                            prevMsgPart = null
                        }

                        try {
                            parsedData = JSON.parse(msg)
                        } catch (ex) {
                            prevMsgPart = msg
                            return;
                        }

                        try {
                            msg = parsedData.SUBSCRIBE.pop()
                            parsedData = msg !== 1 ? JSON.parse(atob(msg)) : 1
                            if (parsedData.data && DATA_TYPE in parsedData.data) 
                                parsedData.data = processCustomType(parsedData.data)
                            console.info(`Incoming data ` + JSON.stringify(parsedData))
                        } catch (ex) {
                            console.error(`Error during parsing message: ${ex}`)
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
            console.info(`Redis communicator ${_key} stopped listening`)
        }
    }

    var processCustomType = function(data)
    {
        if (data[DATA_TYPE] !== TYPE_ERROR)
            throw new Error(`Not supportd custom type: ${data[DATA_TYPE]}`)

        let glob = (function(){return this}).call(null), // Get reference to global context
            err
        
        if (data.name in glob)
            err = new glob[data.name](data.message)
        else
            err = new Error(data.message)
        
        err.stack = data.stack
        return err
    }
}
