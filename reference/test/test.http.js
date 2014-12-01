var assert = require('chai').assert
var request = require('request')
var baseHttpUrl = 'http://localhost:9090/platform/http/'

describe('HTTP module', function () {
  it('should not allow GET requests', function (done) {
    request(baseHttpUrl, function (error, response, body) {
      var resJson = JSON.parse(body)
      assert.equal(resJson.code, 'MethodNotAllowedError', 'GET request should not be allowed')
      done();
    })
  })

  it('should return right status code', function (done) {
    request(baseHttpUrl + 'http://localhost:9090', {
      method: 'POST'
    }, function (error, response, body) {
      var resJson = JSON.parse(body).response
      assert.equal(resJson.statusCode, 404, "There should be 404 status code")
      done();
    })
  })

  it('should return headers including set-cookie', function (done) {
    request(baseHttpUrl + 'https://google.com', {
      method: 'POST'
    }, function (error, response, body) {
      var resJson = JSON.parse(body).response
      assert.equal(resJson.statusCode, 200, "There should be 200 status code")
      assert.isDefined(resJson.headers['set-cookie'], 'Set cookie should be presented in response')
      done();
    })
  })

  it('should return error', function (done) {
    request(baseHttpUrl + 'http://.com', {
      method: 'POST'
    }, function (error, response, body) {
      var resJson = JSON.parse(body).error
      assert.equal(resJson.code, 'ENOTFOUND', "There should be right error code")
      done();
    })
  })

  it('should accept request options', function (done) {
    var uniqString = 'asdlfkjsalfjalsakjsdkasj'
    request(baseHttpUrl + 'http://httpbin.org/post', {
      method: "POST",
      json: {
        "method": "POST",
        "body": "hello=" + uniqString,
        "Content-Type": "application/text"
      }
    }, function (error, response, body) {
      // var resJson = JSON.parse(body)
      resJson = body.body
      assert.notEqual(resJson.indexOf(uniqString), -1, "Uniqe string should be returned")
      done();
    })
  })

  it('should return OWA response', function (done) {
    request(baseHttpUrl + 'https://owa.infobox.ru', {
      method: "POST",
      json: {
        method: 'GET',
        headers: {
          'User-Agent': "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0_2 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12A405 Safari/600.1.4"
        }
      }
    }, function (error, response, body) {
      var resJson = body.body
      assert.notEqual(resJson.indexOf('/owa/'), -1, "Uniqe string should be returned")
      done();
    })
  })

})
