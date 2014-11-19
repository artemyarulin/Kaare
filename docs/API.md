# Kaare API

All resources shares the same url scheme - `platform/{resource}/{resourceId}`. If operation succeed - operation info would be returned. If any error occured - Kaare would return HTTP error 500 with details about the error in JSON format like:
```
{
  error: [Error type code]
  text: [Text description of an error]
  info: [Additional dictionaly with error information]
}
```
Like if you made `POST /platform/http/http://www.google.com/404` you would get response:
```
  HTTP/1.1 500

  {
    error: 404,
    text: 'Page doesn't exists: http://www.google.com/404'
    info: {
      'HTTP/1.1': '404 Not Found'
      'Content-Type': 'text/html; charset=UTF-8'
      'X-Content-Type-Options': 'nosniff'
      'Date': 'Wed, 19 Nov 2014 21:53:32 GMT'
      'Server': 'sffe'
      'Content-Length': '1428'
    }
  }
```

## Methods

Metod/Resource  | http                    | notification             |   io                    | xpath
---             | ----                    | ---                      | ---                     | ----            
GET             |                         |                          | Return file             | apply xpath to xml  
POST            | Create new HTTP request |  Create new notification | Create file             | 
PUT             |                         |                          | Update file             |
DELETE          |                         |                          | Delete file             | 

## HTTP Request
  
```  
  POST platform/http/{URL}

  {requestOptions}
```

Where requestOptions is JSON which will override default request option config (options tooked from [request](https://github.com/request/request)):
  
- method - http method (default: "GET")
- headers - http headers (default: null)
- body - entity body for PATCH, POST and PUT requests (default: null)
- followRedirect - follow HTTP 3xx responses as redirects (default: true). If it set to false and redirect occured - error would be created
- timeout - Integer containing the number of milliseconds to wait for a request to respond before aborting the request (default: null) 
- strictSSL - If true, requires SSL certificates be valid (default: true)
- saveResponseLocation - If set, response would be saved in temporary file. Instead of response body - response file location would be returned (default: null)
