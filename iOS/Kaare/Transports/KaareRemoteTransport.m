#import "KaareRemoteTransport.h"
#import "AFNetworking.h"

@implementation KaareRemoteTransport
{
    NSString* _curKey;
    NSString* _remoteKey;
    NSString* _url;
    OnReceiveHandler _onReceive;
    NSMutableDictionary* _handlers;
    NSURLSessionDataTask* subscribeTask;
}


-(instancetype)initWithOptions:(NSDictionary *)options
{
    if (self = [super init])
    {
        _curKey = options[@"curKey"] ? options[@"curKey"] : @"server.default";
        _remoteKey = options[@"remoteKey"] ? options[@"remoteKey"] : @"client.default";
        _url = options[@"url"] ? options[@"url"] : @"http://localhost:7379";
        _handlers = [@{} mutableCopy];
        [self subscibe:_url];
    }
    return self;
}

-(void)subscibe:(NSString*)url
{
    NSURLSession* session = [NSURLSession sessionWithConfiguration:NSURLSessionConfiguration.ephemeralSessionConfiguration delegate:self delegateQueue:nil];
    subscribeTask = [session dataTaskWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/SUBSCRIBE/%@",_url,_curKey]]];
    [subscribeTask resume];
}

- (void)URLSession:(NSURLSession *)session dataTask:(NSURLSessionDataTask *)dataTask didReceiveData:(NSData *)data
{
    NSString* chunk = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    
    if ([chunk containsString:@"}{"])
        chunk = [chunk stringByReplacingOccurrencesOfString:@"}" withString:@"}\n" options:0 range:NSMakeRange(0, chunk.length)];
    
    [[chunk componentsSeparatedByString:@"\n"] enumerateObjectsUsingBlock:^(NSString* msg, NSUInteger idx, BOOL *stop) {
        if (!msg.length)
            return;
        
        NSError* error;
        NSDictionary* parsedData = [NSJSONSerialization JSONObjectWithData:[msg dataUsingEncoding:NSUTF8StringEncoding] options:0 error:&error];
        if (error)
            NSLog(@"ERROR: Not a valid JSON message: %@,%@",error,msg);
        
        NSString* msgData = ((NSArray*)parsedData[@"SUBSCRIBE"]).lastObject;
        if ([[NSString stringWithFormat:@"%@",msgData] isEqualToString:@"1"])
            return;
        
        NSDictionary* msgValues = [NSJSONSerialization JSONObjectWithData:[[NSData alloc] initWithBase64EncodedString:msgData options:0] options:0 error:nil];
        
        if (msgValues[@"cmd"])
            [self onCommand:msgValues];
        else
            [self onCallback:msgValues];
    }];
}

-(void)publish:(NSString*)key opId:(NSString*)opId type:(NSString*)type data:(id)data
{
    if (data)
        [self publish:key msg:@{@"opId":opId,@"type":type,@"data":data}];
    else
        [self publish:key msg:@{@"opId":opId,@"type":type}];
}

-(void)publish:(NSString*)key opId:(NSString*)opId cmd:(NSString*)cmd params:(NSArray*)params
{
    if (params)
        [self publish:key msg:@{@"opId":opId,@"cmd":cmd,@"params":params}];
    else
        [self publish:key msg:@{@"opId":opId,@"cmd":cmd}];
    
}

-(void)publish:(NSString*)key msg:(NSDictionary*)msg
{
    NSMutableDictionary* msgData = [msg mutableCopy];
    if ([msgData[@"data"] isKindOfClass:[NSError class]])
        msgData[@"data"] = ((NSError*)msgData[@"data"]).userInfo;
    
    NSString* encodedData = [[NSJSONSerialization dataWithJSONObject:msgData options:0 error:nil] base64EncodedStringWithOptions:0];
    NSMutableURLRequest* req = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"%@/PUBLISH/%@/%@",_url,key,encodedData]]];

    NSData* data = [NSURLConnection sendSynchronousRequest:req returningResponse:nil error:nil];
    NSString* output = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if ([output isEqualToString:@"{\"PUBLISH[\":0}"])
        NSLog(@"WARN: There are no subscibers found for this message: %@",msg);
}

-(void)onCommand:(NSDictionary*)cmd
{
    NSString* opId = cmd[@"opId"];
    
    [_onReceive(cmd[@"cmd"],cmd[@"params"]) subscribeNext:^(id x) {
        [self publish:_remoteKey opId:opId type:@"next" data:x];
    } error:^(NSError *error) {
        [self publish:_remoteKey opId:opId type:@"error" data:error];
    } completed:^{
        [self publish:_remoteKey opId:opId type:@"completed" data:nil];
    }];
}

-(void)onCallback:(NSDictionary*)data
{
    NSString* opId = data[@"opId"];
    NSString* type = data[@"type"];
    id cbData = data[@"data"];
    
    id<RACSubscriber> observer = _handlers[opId];

    if (!observer) {
        NSLog(@"Handler for operation %@ cannot be found",opId);
        return;
    }
    
    
    if ([type isEqualToString:@"next"])
        [observer sendNext:cbData];
    else {
        if ([type isEqualToString:@"error"])
            [observer sendError:cbData];
        else if ([type isEqualToString:@"completed"])
             [observer sendCompleted];
        else
            [observer sendError:[NSError errorWithDomain:KaareErrorDomain code:KaareErrUndefined userInfo:@{@"Undefined type":@"type"}]];
            
        [_handlers removeObjectForKey:opId];
    }
}


-(void)onReceive:(OnReceiveHandler)handler
{
    _onReceive = handler;
}

-(RACSignal*)send:(NSString *)cmd params:(NSArray *)params
{
    return [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        NSString* opId = [[NSUUID UUID] UUIDString];
        _handlers[opId] = subscriber;
        [self publish:_remoteKey opId:opId cmd:cmd params:params];
        return nil;
    }];
}

-(void)stop
{
    [subscribeTask suspend];
}
@end
