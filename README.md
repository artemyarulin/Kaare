# Kaare
Cross platform reactive communication channel between JavaScript and native code

Wouldn't it be cool to build UI using ReactiveCocoa and use JavaScript as a cross platform business logic core which could utilize reactive signals to solve callback hell? 

Kaare makes it even more awesome by making communication between native and JS code reactive as well.

## Example of usage
Kaare will handle all the communication from one context to another in both directions

```
-(void)testExampleFromReadme
{
    __block NSString* output = @"";
    
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        // Here you can define how your JS context can be found
        return [self getContextForTestAndEvaluate:@[@"var getString = function(){ return 'Hello' }",
                                                    @"var splitString = function(str) { return Rx.Observable.fromArray(str.split('')) }"]];
    }]];
    
    [[[kaare executeCommand:@"getString" params:nil]
      flattenMap:^RACStream *(id value) { return [kaare executeCommand:@"splitString" params:@[value]]; }]
      subscribeNext:^(id x) { output = [output stringByAppendingString:x]; }
      completed:^{ isDone = YES; XCTAssertEqualObjects(output,@"Hello",@"There should be right output");
    }];
}

-(void)testReturnSignalWithNumber
{
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var forwarder = new kaare.Forwarder()"]];
    }]];
    [kaare registerCommand:@"number" handler:^RACSignal* (NSArray *params) { return [RACSignal return:@(42)]; }];
    
    [context evaluateScript:[NSString stringWithFormat:@"forwarder.executeCommand('number').subscribe(function(v){ output = v*2 },null,function(){ done() })"]];
    
    NSNumber* output = [[context evaluateScript:@"output"] toNumber];
    XCTAssertEqual([output intValue], 84,@"There should be right number");
}
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
- [x] Functionality to call JS functions without kaare.addLocalCommand
- [x] Funcionality to call functions that returns anything but signal
- [x] User can register kaare using any order: JSCore than native, or vice versa. When command exec requested and other side is not yet ready - Kaare would wait for 10 second before fail
- [ ] Forwarder name: Native and JS has a different API naming, we should solve it
- [ ] Remote transport
- [ ] Kaare-Platform
- [ ] Distribution:
    - [x] Compile all JS in Kaare.js
      - [x] Smart distibution - maybe Rx.js already included and we should allow user to include only Kaare functions, without libs
    - [ ] Create CocoaPod for Kaare which will include Kaare.js
    - [ ] Create CocoaPod for Kaare-Platform

## 0.2.0
- [ ] UIWebView transport

## 0.3.0
- [ ] Example project which show the power of Kaare (idea: Some infinite amount of events from JS and populate table based on that?)

## 0.4.0
- [ ] API stabilization, thinking what we can extend in a feature

## 0.5.0
- [ ] Windows Phone
  - [ ] .Net C# Kaare implementation
  - [ ] Windows Phone Web View transport
## 0.6.0
- [ ] Androind   