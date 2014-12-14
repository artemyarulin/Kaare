#import "ReactiveCocoa.h"

typedef RACSignal* (^CommandHandler)(NSArray* params);
typedef RACSignal* (^OnReceiveHandler)(NSString* cmd, NSArray* params);

@protocol KaareTransport

-(RACSignal*)send:(NSString*)cmd params:(NSArray*)params;
-(void)onReceive:(OnReceiveHandler)handler;

@end


@interface Kaare : NSObject

-(instancetype)initWithTransport:(id<KaareTransport>)transport;

-(RACSignal*)executeCommand:(NSString*)cmd params:(NSArray*)params;
-(void)registerCommand:(NSString*)cmd handler:(CommandHandler)handler;

@end

extern NSString* const KaareErrorDomain;

enum KaareErrType
{
    KaareErrUndefined = 0,
    KaareErrCommandNotFound,
    KaareErrJSException
};