kaare.Forwarder = function (transport) {
  let _transport = transport || new kaare.transports.Native()
  this.executeCommand = (cmd, params) => (_transport.send(cmd, params))
}
