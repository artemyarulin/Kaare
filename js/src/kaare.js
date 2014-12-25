var Kaare = function (transport = new Kaare.transports.Native()) { // jshint ignore:line 
    let _localCommands = {},
        _transport = transport

    _transport.onIncomingCommand = (cmd, params) => {
        if (cmd in _localCommands)
        {
            let handler = _localCommands[cmd],
                handlerResult
            
            try { handlerResult = handler(params) }
            catch (ex) { return Rx.Observable.throw(ex) }

            return handlerResult
        }
        return Rx.Observable.throw(new Error(`Command ${cmd} cannot be found`))
    }

    this.executeCommand = (cmd, params) => (_transport.executeCommand(cmd, params))

    this.registerCommand = (cmd, handler) => {
        if (cmd in _localCommands)
            throw new Error(`Kaare already contains a command with name ${cmd}. Consider using different name`)

        _localCommands[cmd] = handler
    }

    this.transport = _transport
}

Kaare.transports = {}
