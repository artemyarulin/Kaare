#import "KaareJSCoreTransport.h"

static NSString* K_SYNC_OBJECT_NAME = @"__kaareTransportNativeSyncObject";

@implementation KaareJSCoreTransport
{
    ContextFinder _contextFinder;
    OnReceiveHandler _receiveHandler;
}

@synthesize onReceive;

-(instancetype)initWithContextFinder:(ContextFinder)contextFinder
{
    if (self = [super init])
    {
        _contextFinder = contextFinder;

        JSContext* context = _contextFinder();
        context[K_SYNC_OBJECT_NAME] = self;
    }
    return self;
}

-(RACSignal*)send:(NSString*)cmd params:(NSArray*)params
{
    return [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        JSContext* context = _contextFinder();
        JSValue* function = [context evaluateScript:cmd];
        
        if ([function isUndefined] || [function isNull])
        {
            [subscriber sendError:[NSError errorWithDomain:KaareErrorDomain
                                                      code:KaareErrCommandNotFound
                                                  userInfo:@{@"Command":cmd,
                                                             @"This":[context evaluateScript:@"this"],
                                                             @"Exception": [context exception],
                                                             @"ExceptionInfo":[[context exception] toObject]}]];
            return nil;
        }
        
        // We wrap the function in order to expand array to function parameters using ES6 spread operator
        // We cannot use apply here, becasue it will override function this 
        JSValue* wrapFunction = [context evaluateScript:[NSString stringWithFormat:@"(function(params){return %@(...params)})",cmd]];
        JSValue* functionCallResult = params.count ? [wrapFunction callWithArguments:@[params]] : [wrapFunction callWithArguments:nil];
        
        if ([context exception])
        {
            [subscriber sendError:[NSError errorWithDomain:KaareErrorDomain
                                                      code:KaareErrJSException
                                                  userInfo:@{@"Command":cmd,
                                                             @"This":[context evaluateScript:@"this"],
                                                             @"Exception": [context exception],
                                                             @"ExceptionInfo":[[context exception] toObject]}]];
            return nil;
        }
        
        
        if ([[functionCallResult valueForProperty:@"subscribe"] isObject])  // Function returns signal, let's subscribe to it
            [functionCallResult invokeMethod:@"subscribe" withArguments:@[^(id v) { [subscriber sendNext:v]; },
                                                                          ^(id error) { [subscriber sendError:error]; },
                                                                          ^() { [subscriber sendCompleted]; } ]];
        else    // Simple value, let's just return it
        {
            [subscriber sendNext:[functionCallResult toObject]];
            [subscriber sendCompleted];
        }
        
        return nil;
    }];
}

-(void)onReceive:(OnReceiveHandler)handler
{
    _receiveHandler = handler;
}

-(void)bridge:(NSString *)cmd :(NSArray *)params :(JSValue *)onNext :(JSValue *)onError :(JSValue *)onCompleted
{
    [_receiveHandler(cmd,params) subscribeNext:^(id value) {
        [onNext callWithArguments:@[value]];
    } error:^(NSError *error) {
        [onError callWithArguments:@[error]];
    } completed:^{
        [onCompleted callWithArguments:nil];
    }];
}

-(void)stop
{
    _contextFinder()[K_SYNC_OBJECT_NAME] = nil;
}

@end
