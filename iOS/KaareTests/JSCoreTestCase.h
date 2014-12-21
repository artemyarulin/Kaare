#import <XCTest/XCTest.h>
#import "AGWaitForAsyncTestHelper.h"

#import "Kaare.h"
#import "KaareJSCoreTransport.h"
#import "KaareRemoteTransport.h"
#import "JSCoreBom.h"

@interface JSCoreTestCase : XCTestCase
{
    JSContext* context;
    BOOL isDone;
}

-(JSContext*)getContextForTestAndEvaluate:(NSArray*)commands;

@end
