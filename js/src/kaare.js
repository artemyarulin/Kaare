var Kaare = function (transport) {	// jshint ignore:line 
  let _transport = transport || new Kaare.transports.Native()
  this.executeCommand = (cmd, params) => (_transport.send(cmd, params))
}

Kaare.transports = {}