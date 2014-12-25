#import "Kaare.h"

NSString* const KaareErrorDomain = @"com.kaare.KaareErrorDomain";

@implementation Kaare
{
    NSMutableDictionary* _localCommands;
    id<KaareTransport> _transport;
}

-(id<KaareTransport>)transport { return _transport; }

-(instancetype)initWithTransport:(id<KaareTransport>)transport
{
    if (self = [super init])
    {
        _localCommands = [@{} mutableCopy];
        _transport = transport;
        [_transport onIncomingCommand:^(NSString *cmd, NSArray *params) {
            if (_localCommands[cmd])
            {
                CommandHandler handler = _localCommands[cmd];
                return handler(params);
            }
            
            return [RACSignal error:[NSError errorWithDomain:KaareErrorDomain
                                                        code:KaareErrCommandNotFound
                                                    userInfo:@{NSLocalizedDescriptionKey:[NSString stringWithFormat:@"Command %@ cannot be found",cmd]}]];
        }];
    }
    return self;
}

-(RACSignal*)executeCommand:(NSString*)cmd params:(NSArray*)params
{
    return [_transport executeCommand:cmd params:params];
}

-(void)registerCommand:(NSString *)cmd handler:(CommandHandler)handler
{
    if (_localCommands[cmd])
        [NSException raise:@"KaareDuplicateCommand" format:@"Kaare already contains a command with name %@. Consider using different name",cmd];
    
    _localCommands[cmd] = handler;
}


@end
