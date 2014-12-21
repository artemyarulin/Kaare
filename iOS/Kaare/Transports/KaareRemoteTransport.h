#import "Kaare.h"

@interface KaareRemoteTransport : NSObject <KaareTransport, NSURLSessionDelegate>

/*
 @param options Followin keys are supported: {curKey, remoteKey, url}
*/
-(instancetype)initWithOptions:(NSDictionary*)options;

@end
