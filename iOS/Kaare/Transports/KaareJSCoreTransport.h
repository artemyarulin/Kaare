@import JavaScriptCore;
#import "Kaare.h"

typedef JSContext*(^ContextFinder)();

@protocol KaareJSCoreExports <JSExport>

-(void)execNative:(NSString*)cmd
                 :(NSArray*)params
                 :(JSValue*)onNext
                 :(JSValue*)onError
                 :(JSValue*)onCompleted;

@property (retain) JSValue* execJS;

@end

@interface KaareJSCoreTransport : NSObject <KaareTransport, KaareJSCoreExports>

-(instancetype)initWithContextFinder:(ContextFinder)contextFinder;

@end