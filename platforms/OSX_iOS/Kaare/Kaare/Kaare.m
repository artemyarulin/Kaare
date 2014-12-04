#import "Kaare.h"


@implementation KaareNative

+(void)executeCommandNative:(NSString*)cmd
                           :(NSArray*)params
                           :(JSValue*)onNext
                           :(JSValue*)onError
                           :(JSValue*)onCompleted
{
    NSString* str = params[0];
    
    [str enumerateSubstringsInRange:NSMakeRange(0, str.length)
                            options:NSStringEnumerationByComposedCharacterSequences
                         usingBlock:^(NSString *substring, NSRange substringRange, NSRange enclosingRange, BOOL *stop) {
                             [onNext callWithArguments:@[substring]];
                         }];
    [onCompleted callWithArguments:NULL];
}

@end

@implementation Kaare

+(RACSignal*)executeCommandNative:(NSString*)cmd params:(NSArray*)params
{
    return [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        NSString* str = params[0];
        
        [str enumerateSubstringsInRange:NSMakeRange(0, str.length)
                                options:NSStringEnumerationByComposedCharacterSequences
                             usingBlock:^(NSString *substring, NSRange substringRange, NSRange enclosingRange, BOOL *stop) {
                                 [subscriber sendNext:substring];
                             }];
        
        [subscriber sendCompleted];
        
        return NULL;
    }];
}

+(RACSignal*)executeCommandJS:(NSString*)cmd params:(NSArray*)params context:(JSContext*)context
{
    JSValue* function = [context evaluateScript:cmd];
    JSValue* rxJSSignal = [function callWithArguments:params];
    
    return [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        [rxJSSignal invokeMethod:@"subscribe" withArguments:@[^(NSString* s) { [subscriber sendNext:s]; },
                                                              ^(id error) { [subscriber sendError:error]; },
                                                              ^(){  [subscriber sendCompleted]; } ]];
        return NULL;
    }];
}


@end
