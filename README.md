# Kaare
Cross platform reactive communication channel between JavaScript and native code

Wouldn't it be cool to build UI using ReactiveCocoa and use JavaScript as a cross platform business logic core which will utilize RxJS to solve callback hell? 

Kaare makes it even more awesome by making communication between native and JS code reactive as well.

## Example of usage
Kaare will handle all the communication from one context to another in both directions

Your JS file:
```
var kaare = new Kaare(new KaareNativeTransport())
var splitString = function(str) { return Rx.Observable.fromArray(str.split('')) }
var duplicateString = function(str) { return kaare.executeCommand('duplicateString',[str]) }

splitString('hello')									// ['h','e','l','l','o']
	.map(function(v){ return duplicateString(v) })		// ['hh','ee','ll','ll','oo']
	.filter(function(v) { return v !== 'l' })			// ['hh','ee','oo']
	.subscribe(function(v) { console.log(v) })			// output: ['hh','ee','oo']
```

Your Objective-C file:
```
Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc]
                                                     initWithOptions:nil
                                                     contextFinder:^JSContext *{
        return [self findContext]; // You can specify here where your context is located
}]];
    
RACSignal* (^splitString)(NSString*) = ^RACSignal* (NSString* str) {
    return [kaare executeCommand:@"splitString" params:@[str]];
};

RACSignal* (^duplicateString)(NSArray*) = ^RACSignal* (NSArray* params){
    return [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        [subscriber sendNext:[params[0] stringByAppendingString:params[0]]];
        [subscriber sendCompleted];
        return nil;
    }];
};
// Objective-c is not dynamic enough, so we have to register command in order to make it callable from JS
[kaare addLocalCommand:@"duplicateString" handler:duplicateString];

[[[splitString(@"hello")
   map:^id(NSString* v) { return duplicateString(@[v]); }]
   filter:^BOOL(NSString* v) { return ![v isEqualToString:@"l"]; }]
   subscribeNext:^(NSString* v) { NSLog(@"%@",v); }];
```

# Extensions
Kaare could be easily extended with new handlers. For example [Kaare Platform](https://github.com/artemyarulin/Kaare-Platform) brings some of the native API functions that could be useful for your JS.

```
var app = {}
app.kaare = new Kaare(new KaareNativeTransport())
app.platform = new KaarePlatform(kaare)

app.platform.httpRequest('http://google.com')
  .map(function(response)       { return response.body })
  .map(function(body)           { return app.platform.xPath(body,'//input/@value') })
  .map(function(inputValue)     { return 'Found name with value: ' + inputValue })
  .subscribe(function(logEntry) { console.log(logEntry) })
```

# Transports
Kaare supports different transports in order to support different execution contexts of JS (JavaScriptCore, UIWebView). One of the transports allows remote communication between your JS and native code, which is very handy for development.

shell: `vagrant up` which will bring up redis and webdis <br>
JS: `var kaare = new Kaare(new KaareRemoteTransport('http://vagrantHost:7656'))` <br>
Obj-C: `Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareRemoteTransport alloc] initWithOptions:@{@"url":@"http://vagrantHost:7656"}]`

From now on you can develop all your JS code using your favorite OS and tools like mocha, gulp, etc. AND at the same time use native API of the OS, no need to mock it all, no need to change your code.

# Roadmap

## 0.1.0
- [ ] Functionality to call JS functions without kaare.addLocalCommand
- [ ] Remote transport
- [ ] Kaare-Platform
- [ ] Distribution:
    - [ ] Compile all JS in Kaare.js
    - [ ] Create CocoaPod for Kaare which will include Kaare.js
    - [ ] Create CocoaPod for Kaare-Platform

## 0.2.0
- [ ] Funcionality to call functions that returns anything but signal
- [ ] UIWebView transport
- [ ] Command buffer which will allow users not to think about activation order and just wait untill the tranports handshake finishes

## 0.3.0
- [ ] Example project which show the power of Kaare (idea: Some infinite amount of events from JS and populate table based on that?)
- [ ] Smart distibution - maybe Rx.js already included and we should enable use to include only Kaare functions, without libs

## 0.4.0
- [ ] API stabilization, thinking what we can extend in a feature

## 0.5.0
- [ ] Windows Phone
  - [ ] .Net C# Kaare implementation
  - [ ] Windows Phone Web View transport
## 0.6.0
- [ ] Androind   