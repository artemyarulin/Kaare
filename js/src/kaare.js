var Kaare = function (transport) { // jshint ignore:line 
    this.transport = transport || new Kaare.transports.Native()

    this.transport.onIncomingCommand = (cmd, params) => {
        let retVal = _getCommandResult(cmd, params)

        if (retVal instanceof Rx.Observable)
            return retVal
        else
            return new Rx.Observable.return(retVal)
    }


    this.executeCommand = (cmd, params) => (this.transport.send(cmd, params))

    var _getCommandResult = (cmd, params) => {
        let func, err

        try { func = eval.call(null, cmd) }
        catch (e) { err = e}
        
        if (err)
            return Rx.Observable.throw(new Error(`Command ${cmd} returned exception ${err}`))            

        if (!func)
            return Rx.Observable.throw(new Error(`Command ${cmd} cannot be found`))
        
        if (typeof func === 'function')
            return func.apply(null,params)

        if (func instanceof Rx.Observable)
            return func
        else
            return Rx.Observable.return(func)
    }
}

Kaare.transports = {}