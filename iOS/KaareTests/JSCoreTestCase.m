#import "JSCoreTestCase.h"

@implementation JSCoreTestCase

-(JSContext*)getContextForTestAndEvaluate:(NSArray*)commands
{
    if (!context)
    {
        context = [[JSContext alloc] init];
        [[JSCoreBom shared] extend:context];
        
        [context evaluateScript:[NSString stringWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"kaare.full" ofType:@"js"]
                                                          encoding:NSUTF8StringEncoding
                                                             error:NULL]];
        if (context.exception)
            XCTFail(@"Execpetion occured while loading Kaare: %@",context.exception);
        
        for (NSString* cmd in commands) {
            [context evaluateScript:cmd];
            
            if (context.exception)
                XCTFail(@"Execpetion occured while executing command %@\n%@",cmd,context.exception);
        }
    }
    
    context[@"done"] = ^(){
        isDone = YES;
    };

    return context;
}

-(void)setUp { context = nil; isDone = NO; }

@end
