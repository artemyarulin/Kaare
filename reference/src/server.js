var restify = require('restify'),
  request = require('request'),
  server = restify.createServer(),
  platformPrefix = 'platform'

server.use(restify.bodyParser());

server.post(/^\/platform\/http\/(.*)/, function (req, res, next) {
  var options = req.body || {method: 'GET'}
  var url = req.params[0]
  request(url, options, function (error, response, body) {
    if (error) {
      var output = {
        error: error,
        text: error,
        info: error
      }
      res.send(500, output)
    } else {
      var output = {
        response: {
          statusCode: response.statusCode,
          headers: response.headers,
          url: response.url,
          method: response.method
        },
        body: body
      }
      res.send(200, output)
    }
    next()
  })
})

server.listen(9090, function () {
  console.log('%s listening at %s', server.name, server.url);
});
