#import "KaareJSCoreTransport.h"

static NSString* K_SYNC_OBJECT_NAME = @"__kaareTransportNativeSyncObject";
const int SYNC_MAX_RETRY = 10;

@implementation KaareJSCoreTransport
{
    ContextFinder _contextFinder;
    OnReceiveHandler _receiveHandler;
}

@synthesize execJS;

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

-(RACSignal*)executeCommand:(NSString *)cmd params:(NSArray *)params
{
    return [[RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        JSValue* jsExecutor = [self execJS];
        if (!jsExecutor || [jsExecutor isUndefined])
        {
            NSLog(@"Sync object is not yet ready on JS side");
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                [subscriber sendError:[NSError errorWithDomain:KaareErrorDomain code:KaareTransportError userInfo:nil]];
            });
        }
        else
        {
            JSValue* retVal = [jsExecutor callWithArguments:(params ? @[cmd,params] : @[cmd])];
            
            if ([[retVal valueForProperty:@"subscribe"] isObject])
                [retVal invokeMethod:@"subscribe" withArguments:@[^(id v) { [subscriber sendNext:v]; },
                                                                  ^(id error) {            
                    if (error[@"message"] && error[@"name"]) // We assume that this is Error object
                        [subscriber sendError:[NSError errorWithDomain:KaareErrorDomain
                                                                  code:KaareErrJSError
                                                              userInfo:@{NSLocalizedDescriptionKey:[NSString stringWithFormat:@"%@: %@",error[@"name"],error[@"message"]],
                                                                         NSLocalizedFailureReasonErrorKey: [NSString stringWithFormat:@"Line %@:%@",error[@"line"],error[@"column"]]}]];
                    else
                        [subscriber sendError:error];
                },
                                                                  ^() { [subscriber sendCompleted]; } ]];
            else
            {
                JSContext* context = _contextFinder();
                [subscriber sendError:[NSError errorWithDomain:KaareErrorDomain
                                                          code:KaareErrJSError
                                                      userInfo:@{NSLocalizedDescriptionKey:[NSString stringWithFormat:@"Error occured during %@ command execution",cmd],
                                                                 NSLocalizedFailureReasonErrorKey: [NSString stringWithFormat:@"%@. %@",
                                                                                                    [context exception],
                                                                                                    [[context exception] toDictionary]],}]];
            }
        }
        
        return nil;
    }] retry:SYNC_MAX_RETRY];
}

-(void)onIncomingCommand:(OnReceiveHandler)handler
{
    _receiveHandler = handler;
}

-(void)execNative:(NSString *)cmd :(NSArray *)params :(JSValue *)onNext :(JSValue *)onError :(JSValue *)onCompleted
{
    [_receiveHandler(cmd,params) subscribeNext:^(id value) {
        [onNext callWithArguments:@[value]];
    } error:^(NSError *error) {
        [onError callWithArguments:@[error]];
    } completed:^{
        [onCompleted callWithArguments:nil];
    }];
}

-(void)stopReceiving
{
    _contextFinder()[K_SYNC_OBJECT_NAME] = nil;
}

@end
