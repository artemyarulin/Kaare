#import "JSCoreTestCase.h"

@interface testNativeToJSCore : JSCoreTestCase

@end

@implementation testNativeToJSCore

-(void)testReturnJSSignal
{
    __block NSMutableArray* output = [@[] mutableCopy];
    int rangeLength = 5;
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var kaare = new Kaare()",
                                                    @"kaare.registerCommand('range', function(params) { return Rx.Observable.range(1,params[0]) })" ]];
    }]];
    
    [[kaare executeCommand:@"range" params:@[@(rangeLength)]]
        subscribeNext:^(id v) { [output addObject:v]; }
        error:^(NSError *error) { XCTFail(@"There should be no error: %@",error); }
        completed:^{ isDone = YES; }
    ];
    
    if (!isDone) WAIT_WHILE(!isDone, 2);

    XCTAssertEqual(output.count, (NSUInteger)rangeLength,@"There should be right number of numbers");
    [@[@1,@2,@3,@4,@5] enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        XCTAssertEqualObjects(obj, output[idx],@"Returned value should be right");
    }];
}




-(void)testReturnJSArray
{
    __block NSMutableArray* output = [@[] mutableCopy];
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var kaare = new Kaare()",
                                                    @"kaare.registerCommand('split', function(params) { return Rx.Observable.fromArray(params[0].split('')) })" ]];
    }]];
    
    
    [[kaare executeCommand:@"split" params:@[@"hello"]]
        subscribeNext:^(id v) { [output addObject:v]; }
        error:^(NSError *error) { XCTFail(@"There should be no error: %@",error); }
        completed:^{ isDone = YES; }
    ];
    
    if (!isDone) WAIT_WHILE(!isDone, 2);
    
    XCTAssertEqual(output.count, (NSUInteger)5,@"There should be right number of items");
    [@[@"h",@"e",@"l",@"l",@"o"] enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
        XCTAssertEqualObjects(obj, output[idx],@"Returned value should be right");
    }];
}

-(void)testReturnJSInt
{
    __block int output;
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var kaare = new Kaare()",
                                                    @"kaare.registerCommand('val', function(params) { return Rx.Observable.return(params[0]) })" ]];
    }]];
    
    
    [[kaare executeCommand:@"val" params:@[@(42)]]
        subscribeNext:^(id v) {!output ? output = [v intValue] : XCTFail(@"Method should return value only once"); }
        error:^(NSError *error) { XCTFail(@"There should be no error: %@",error); }
        completed:^{ isDone = YES; }
    ];
    
    if (!isDone) WAIT_WHILE(!isDone, 2);
    
    XCTAssertEqual(output, 42,@"There should be right output");
}

-(void)testReturnJSObject
{
    __block NSDictionary* output;
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var kaare = new Kaare()",
                                                    @"kaare.registerCommand('cust', function(params) { return Rx.Observable.return({a:1,b:2}) })" ]];
    }]];
    
    
    [[kaare executeCommand:@"cust" params:nil]
        subscribeNext:^(id v) { !output ? output = v : XCTFail(@"Method should return value only once"); }
        error:^(NSError *error) { XCTFail(@"There should be no error: %@",error); }
        completed:^{ isDone = YES; }
    ];
    
    if (!isDone) WAIT_WHILE(!isDone, 2);
    
    NSDictionary* expectedOutput = @{@"a":@1,@"b":@2};
    XCTAssertEqualObjects(output, expectedOutput, @"There should be right output");
}

-(void)testShouldReturnErrorIfCommandNotFound
{
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var kaare = new Kaare()"]];
    }]];
    

    [[kaare executeCommand:@"range" params:nil]
     subscribeNext:^(id v) { XCTFail(@"There should be no value %@", v); }
     error:^(NSError *error) {
         XCTAssert([error isKindOfClass:NSError.class],@"There should be right type of an error");
         XCTAssert([error.localizedDescription containsString:@"cannot be found"],@"There should be right message");
         isDone = YES;
     }
     completed:^{ XCTFail(@"Complete should never be called");}
     ];
    
    if (!isDone) WAIT_WHILE(!isDone, 2);
}

-(void)testShouldBeAbleToReceiveErrorsFromCommand
{
    Kaare* kaare = [[Kaare alloc] initWithTransport:[[KaareJSCoreTransport alloc] initWithContextFinder:^JSContext *{
        return [self getContextForTestAndEvaluate:@[@"var kaare = new Kaare()",
                                                    @"kaare.registerCommand('range', function(params) { return Rx.Observable.throw(new Error('Hello')) })" ]];
    }]];
    
    
    [[kaare executeCommand:@"range" params:nil]
        subscribeNext:^(id v) { XCTFail(@"There should be no value %@", v); }
        error:^(NSError *error) {
            XCTAssert([error isKindOfClass:NSError.class],@"There should be right type of an error");
            XCTAssert([error.localizedDescription containsString:@"Hello"],@"There should be right message");
            XCTAssertNotNil(error.localizedFailureReason,@"There should be additional info about place of an error");
            isDone = YES;
        }
         completed:^{ XCTFail(@"Complete should never be called");}
     ];
    
    if (!isDone) WAIT_WHILE(!isDone, 2);
}


@end
