#import "JSCoreTestCase.h"

@interface testJSCoreToNative : JSCoreTestCase

@end

@implementation testJSCoreToNative

-(void)testReturnSignalWithArray
{
    int rangeLength = 5;
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var forwarder = new kaare.Forwarder()",
                                                    @"var output = []"]];
    }]];
    [kaare registerCommand:@"range" handler:^RACSignal* (NSArray *params) {
        return [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
            for (int i=1;i<=[params[0] intValue];i++) [subscriber sendNext:@(i)];
            [subscriber sendCompleted];
            return nil;
        }];
    }];
    
    [context evaluateScript:[NSString stringWithFormat:@"forwarder.executeCommand('range',[%d]).subscribe(function(v){ output.push(v) },null,function(){ done() })",rangeLength]];
    if (!isDone) WAIT_WHILE(!isDone,1);
    
    NSArray* output = [[context evaluateScript:@"output"] toArray];
    XCTAssertEqual(output.count, (NSUInteger)rangeLength,@"There should be right number of numbers");
    [@[@1,@2,@3,@4,@5] enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        XCTAssertEqualObjects(obj, output[idx],@"Returned value should be right");
    }];
}

-(void)testReturnSignalWithNumber
{
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var forwarder = new kaare.Forwarder()"]];
    }]];
    [kaare registerCommand:@"number" handler:^RACSignal* (NSArray *params) { return [RACSignal return:@(42)]; }];
    
    [context evaluateScript:[NSString stringWithFormat:@"forwarder.executeCommand('number').subscribe(function(v){ output = v*2 },null,function(){ done() })"]];
    if (!isDone) WAIT_WHILE(!isDone,1);
    
    NSNumber* output = [[context evaluateScript:@"output"] toNumber];
    XCTAssertEqual([output intValue], 84,@"There should be right number");
}

-(void)testReturnSignalWithNoValue
{
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var forwarder = new kaare.Forwarder()"]];
    }]];
    [kaare registerCommand:@"number" handler:^RACSignal* (NSArray *params) { return [RACSignal return:@(42)]; }];
    
    [context evaluateScript:[NSString stringWithFormat:@"forwarder.executeCommand('number').subscribe(function(v){ output = v*2 },null,function(){ done() })"]];
    if (!isDone) WAIT_WHILE(!isDone,1);
    
    NSNumber* output = [[context evaluateScript:@"output"] toNumber];
    XCTAssertEqual([output intValue], 84,@"There should be right number");
}

@end
