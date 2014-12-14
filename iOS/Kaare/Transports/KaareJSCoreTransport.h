#import "Kaare.h"
@import JavaScriptCore;

typedef JSContext*(^ContextFinder)();

@protocol KaareJSCoreExports <JSExport>

-(void)bridge:(NSString*)cmd
             :(NSArray*)params
             :(JSValue*)onNext
             :(JSValue*)onError
             :(JSValue*)onCompleted;

@property JSValue* onReceive;

@end

@interface KaareJSCoreTransport : NSObject <KaareTransport, KaareJSCoreExports>

-(instancetype)initWithContextFinder:(ContextFinder)contextFinder;

@end