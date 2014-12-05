#import <XCTest/XCTest.h>
#import "Kaare.h"
@import JavaScriptCore;
#import "JSCoreBom.h"
#import "AGWaitForAsyncTestHelper.h"

@interface JSCJSToNative : XCTestCase

@end

@implementation JSCJSToNative

-(void)testJSToNativeShouldWork
{
    JSContext* context = [[JSContext alloc] init];
    [[JSCoreBom shared] extend:context];
    context[@"log"] = ^(NSString* s) { NSLog(@"%@",s); };
    context[@"KaareNative"] = KaareNative.class;
    
    __block BOOL isDone = NO;
    context[@"done"] = ^() { isDone = YES; };
    
    NSString* rxjs = [NSString stringWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"js/rx.all" ofType:@"js"]
                                               encoding:NSUTF8StringEncoding
                                                  error:NULL];
    NSString* kaarejs = [NSString stringWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"js/kaare" ofType:@"js"]
                                                  encoding:NSUTF8StringEncoding
                                                     error:NULL];
    
    [context evaluateScript:rxjs];
    [context evaluateScript:kaarejs];
    
    [self measureBlock:^{
        [context evaluateScript:@"callNativeSplit()"];
        if (!isDone) WAIT_WHILE(!isDone, 1);
    }];
}

@end
