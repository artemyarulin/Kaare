#import <XCTest/XCTest.h>
#import "AGWaitForAsyncTestHelper.h"
#import "Kaare.h"
@import JavaScriptCore;
#import "JSCoreBom.h"

@interface JSCNativeToJS : XCTestCase

@end

@implementation JSCNativeToJS

- (void)testNativeToJSShouldWork {
    NSString* in = @"Hello";
    __block NSString* out = @"";
    __block BOOL isDone = NO;

    [[Kaare executeCommandNative:@"splitStringByChar" params:@[in]] subscribeNext:^(NSString* s) {
        out = [out stringByAppendingString:s];
    } completed:^{
        XCTAssertEqualObjects(in, out,@"JS code returned wrong string");
        isDone = YES;
    }];
    
    if (!isDone) WAIT_WHILE(!isDone, 10000);
}

-(void)testPerformanceNative
{
    [self measureBlock:^{
        NSString* in = @"Hello";
        __block NSString* out = @"";
        __block BOOL isDone = NO;
        
        [[Kaare executeCommandNative:@"splitStringByChar" params:@[in]] subscribeNext:^(NSString* s) {
            out = [out stringByAppendingString:s];
        } completed:^{
            XCTAssertEqualObjects(in, out,@"JS code returned wrong string");
            isDone = YES;
        }];
        
        if (!isDone) WAIT_WHILE(!isDone, 1);
    }];
}

-(void)testPerformanceJS
{
    JSContext* context = [[JSContext alloc] init];
    [[JSCoreBom shared] extend:context];
    
    NSString* rxjs = [NSString stringWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"js/rx.all" ofType:@"js"]
                                               encoding:NSUTF8StringEncoding
                                                  error:NULL];
    NSString* kaarejs = [NSString stringWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"js/kaare" ofType:@"js"]
                                                  encoding:NSUTF8StringEncoding
                                                     error:NULL];
    
    [context evaluateScript:rxjs];
    [context evaluateScript:kaarejs];
    
    
    [self measureBlock:^{
        NSString* in = @"Hello";
        __block NSString* out = @"";
        __block BOOL isDone = NO;
        
        [[Kaare executeCommandJS:@"splitStringByChar" params:@[in] context:context] subscribeNext:^(NSString* s) {
            out = [out stringByAppendingString:s];
        } completed:^{
            XCTAssertEqualObjects(in, out,@"JS code returned wrong string");
            isDone = YES;
        }];
        
        if (!isDone) WAIT_WHILE(!isDone, 1);
    }];
}

@end
