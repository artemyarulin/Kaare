#import "Kaare.h"

NSString* const KaareErrorDomain = @"com.kaare.KaareErrorDomain";

@implementation Kaare
{
    NSMutableDictionary* _localCommands;
    id<KaareTransport> _transport;
}

-(instancetype)initWithTransport:(id<KaareTransport>)transport
{
    if (self = [super init])
    {
        _localCommands = [@{} mutableCopy];
        _transport = transport;
        [_transport onReceive:^(NSString *cmd, NSArray *params) {
            return [self executeCommand:cmd params:params];
        }];
    }
    return self;
}

-(RACSignal*)executeCommand:(NSString*)cmd params:(NSArray*)params
{
    if (_localCommands[cmd])
    {
        CommandHandler handler = _localCommands[cmd];
        return handler(params);
    }
    
    return [_transport send:cmd params:params];
}

-(void)registerCommand:(NSString *)cmd handler:(CommandHandler)handler
{
    if (_localCommands[cmd])
        [NSException raise:@"KaareDuplicateCommand" format:@"Kaare already contains a command with name %@. Consider using different name or namespace",cmd];
    
    _localCommands[cmd] = handler;
}

-(id<KaareTransport>)transport { return _transport; }

@end
