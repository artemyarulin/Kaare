#import "Kaare.h"

@interface KaareRemoteTransport : NSObject <KaareTransport, NSURLSessionDelegate>

/*
 @param options Following keys are supported: {curKey, remoteKey, url}
*/
-(instancetype)initWithOptions:(NSDictionary*)options;

@end
