#import "JSCoreTestCase.h"

@interface testNativeToJSCore : JSCoreTestCase

@end

@implementation testNativeToJSCore

-(void)testReturnJSSignal
{
    __block NSMutableArray* output = [@[] mutableCopy];
    int rangeLength = 5;
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var range = function(max) { return Rx.Observable.range(1,max) }" ]];
    }]];


    [[kaare executeCommand:@"range" params:@[@(rangeLength)]] subscribeNext:^(id v) { [output addObject:v]; }
                                                                      error:^(NSError *error) { XCTFail(@"There should be no error: %@",error); }
                                                                  completed:^{ isDone = YES; }];
    if (!isDone) WAIT_WHILE(!isDone, 1);

    XCTAssertEqual(output.count, (NSUInteger)rangeLength,@"There should be right number of numbers");
    [@[@1,@2,@3,@4,@5] enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        XCTAssertEqualObjects(obj, output[idx],@"Returned value should be right");
    }];
}

-(void)testReturnJSArray
{
    __block NSArray* output;
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:nil];
    }]];
    
    
    [[kaare executeCommand:@"'hello'.split" params:@[@""]] subscribeNext:^(id v) { !output ? output = v : XCTFail(@"Method should return value only once"); }
                                                                      error:^(NSError *error) { XCTFail(@"There should be no error: %@",error); }
                                                                  completed:^{ isDone = YES; }];
    if (!isDone) WAIT_WHILE(!isDone, 1);
    
    XCTAssertEqual(output.count, (NSUInteger)5,@"There should be right number of items");
    [@[@"h",@"e",@"l",@"l",@"o"] enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        XCTAssertEqualObjects(obj, output[idx],@"Returned value should be right");
    }];
}

-(void)testReturnJSInt
{
    __block int output;
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:nil];
    }]];
    
    
    [[kaare executeCommand:@"(function(){return 42})" params:nil] subscribeNext:^(id v) {
        !output ? output = [v intValue] : XCTFail(@"Method should return value only once");
    }
                                                                   error:^(NSError *error) { XCTFail(@"There should be no error: %@",error); }
                                                               completed:^{ isDone = YES; }];
    if (!isDone) WAIT_WHILE(!isDone, 1);
    
    XCTAssertEqual(output, 42,@"There should be right output");
}

-(void)testReturnJSObject
{
    __block NSDictionary* output;
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:nil];
    }]];
    
    
    [[kaare executeCommand:@"(function(){return {a:1,b:2}})" params:nil] subscribeNext:^(id v) {
        !output ? output = v : XCTFail(@"Method should return value only once");
    }
                                                                          error:^(NSError *error) { XCTFail(@"There should be no error: %@",error); }
                                                                      completed:^{ isDone = YES; }];
    if (!isDone) WAIT_WHILE(!isDone, 1);
    
    NSDictionary* expectedOutput = @{@"a":@1,@"b":@2};
    XCTAssertEqualObjects(output, expectedOutput, @"There should be right output");
}

-(void)testExampleFromReadme
{
    __block NSString* output = @"";
    
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var getString = function(){ return 'Hello' }",
                                                    @"var splitString = function(str) { return Rx.Observable.fromArray(str.split('')) }"]];
    }]];
    
    [[[kaare executeCommand:@"getString" params:nil]
      flattenMap:^RACStream *(id value) { return [kaare executeCommand:@"splitString" params:@[value]]; }]
      subscribeNext:^(id x) { output = [output stringByAppendingString:x]; }
      completed:^{ isDone = YES; XCTAssertEqualObjects(output,@"Hello",@"There should be right output");
    }];
    
    if (!isDone) WAIT_WHILE(!isDone, 1);
}

@end
