#import <ReactiveCocoa.h>

typedef RACSignal* (^CommandHandler)(NSArray* params);
typedef RACSignal* (^OnReceiveHandler)(NSString* cmd, NSArray* params);

@protocol KaareTransport

-(RACSignal*)executeCommand:(NSString*)cmd params:(NSArray*)params;

-(void)onIncomingCommand:(OnReceiveHandler)handler;

-(void)stopReceiving;

@end


@interface Kaare : NSObject

@property (readonly) id<KaareTransport> transport;

-(instancetype)initWithTransport:(id<KaareTransport>)transport;

-(RACSignal*)executeCommand:(NSString*)cmd params:(NSArray*)params;

-(void)registerCommand:(NSString*)cmd handler:(CommandHandler)handler;

@end

extern NSString* const KaareErrorDomain;

enum KaareErrType
{
    KaareErrUndefined = 0,
    KaareErrCommandNotFound,
    KaareErrJSError,
    KaareTransportError
};