# Kaare
Cross platform reactive communication channel between JavaScript and native code

Wouldn't it be cool to build UI using ReactiveCocoa and use JavaScript as a cross platform business logic core which will utilize RxJS to solve callback hell? 

Kaare makes it even more awesome by making communication between native and JS code reactive as well.

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



# Transports
Kaare support following communication schemes:

Scheme							| Desc
---						 		| ---
JavaScriptCore <> Native 		| Using JavaScriptCore bindings
UIWebView <> Native 	 		| Using [WebViewJavaScriptBridge](https://github.com/marcuswestin/WebViewJavascriptBridge) 
HTML page (useful for testing)  | HTTP transport is used based on [webdis](https://github.com/nicolasff/webdis)      		 