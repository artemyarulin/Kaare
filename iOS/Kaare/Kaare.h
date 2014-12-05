#import <Foundation/Foundation.h>
#import "ReactiveCocoa.h"
@import JavaScriptCore;

@protocol KaareJSExport <JSExport>

+(void)executeCommandNative:(NSString*)cmd
                           :(NSArray*)params
                           :(JSValue*)onNext
                           :(JSValue*)onError
                           :(JSValue*)onCompleted;

@end

@interface KaareNative : NSObject <KaareJSExport>

@end


@interface Kaare : NSObject

+(RACSignal*)executeCommandNative:(NSString*)cmd params:(NSArray*)params;
+(RACSignal*)executeCommandJS:(NSString*)cmd params:(NSArray*)params context:(JSContext*)context;

@end
