#import "JSCoreTestCase.h"

@interface testRemoteTransport : JSCoreTestCase

@end

@implementation testRemoteTransport
{
    Kaare* kaare1;
    Kaare* kaare2;
}

-(void)cleanup { [kaare1.transport stopReceiving]; [kaare2.transport stopReceiving]; }

-(CommandHandler)range
{
    return ^RACSignal* (NSArray *params) {
        return [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
            @try {
                for (int i=1;i<=[params[0] intValue];i++) [subscriber sendNext:@(i)];
                [subscriber sendCompleted];
            }
            @catch (NSException *exception) {
                [subscriber sendError:[NSError errorWithDomain:KaareErrorDomain code:KaareErrUndefined userInfo:@{@"type":exception.name,
                                                                                                                   @"message":exception.reason}]];
            }
            return nil;
        }];
    };
}

-(void)setUp
{
    [super setUp];
    [self cleanup];
    
    kaare1 = [[Kaare alloc] initWithTransport:[[KaareRemoteTransport alloc] initWithOptions:@{@"curKey":@"client1",@"remoteKey":@"client2"}]];
    kaare2 = [[Kaare alloc] initWithTransport:[[KaareRemoteTransport alloc] initWithOptions:@{@"curKey":@"client2",@"remoteKey":@"client1"}]];
    
    // Give subscibers some time to connect to server
    __block BOOL isWaitDone = NO;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        isWaitDone = YES;
    });
    WAIT_WHILE(!isWaitDone, 2);
}

-(void)tearDown
{
    [super tearDown];
    [self cleanup];
}

-(void)testRemoteTransportShouldWork
{
    NSMutableArray* output = [@[] mutableCopy];
    [kaare2 registerCommand:@"range" handler:[self range]];
    
    [[kaare1 executeCommand:@"range" params:@[@5]]
        subscribeNext:^(id v) { [output addObject:v]; }
        error:^(NSError *error) { XCTFail(@"There should be no error %@", error); }
        completed:^{
            XCTAssertEqual(output.count, (NSUInteger)5,@"There should be right number of numbers");
            [@[@1,@2,@3,@4,@5] enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
                XCTAssertEqualObjects(obj, output[idx],@"Returned value should be right");
            }];
            isDone = YES;
    }];
    
    if (!isDone) WAIT_WHILE(!isDone, 2);
}

-(void)testRemoteTransportShouldReturnErrorIfCommandNotFound
{
    [[kaare1 executeCommand:@"range" params:nil]
        subscribeNext:^(id v) { XCTFail(@"There should be no value %@", v); }
        error:^(NSError *error) {
            XCTAssert([error isKindOfClass:NSError.class],@"There should be right type of an error");
            XCTAssert([error.localizedDescription containsString:@"cannot be found"],@"There should be right message");
            isDone = YES;
        }
        completed:^{ XCTFail(@"Complete should never be called");}
     ];
    
    if (!isDone) WAIT_WHILE(!isDone, 200);
}

@end
