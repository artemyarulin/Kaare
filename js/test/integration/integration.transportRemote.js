function MyError(message) {
    this.name = 'MyError'
    this.message = message
    if (Error.captureStackTrace)
        Error.captureStackTrace(this, MyError)
}
MyError.prototype = new Error()

describe('Transport.Remote', () => {
    let kaare1,
        kaare2,
        cleanup = () => {
            if (kaare1) kaare1.transport.stopReceiving()
            if (kaare2) kaare2.transport.stopReceiving()
        }

    beforeEach((done) => {
        cleanup()
        kaare1 = new Kaare(new Kaare.transports.Remote({
            curKey: 'client1',
            remoteKey: 'client2'
        }))

        kaare2 = new Kaare(new Kaare.transports.Remote({
            curKey: 'client2',
            remoteKey: 'client1'
        }))

        setTimeout(() => done(), 200) // Give subscribers some time to connect. In should never be an issue in real code
    })

    afterEach(cleanup)

    it('should be able to execute command remotely', (done) => {
        let output = []
        kaare2.registerCommand('range',(max) => (Rx.Observable.range(1,max)))
        kaare1.executeCommand('range',[5]).subscribe(
            v => output.push(v),
            e => assert.fail(e, null, `There should be no error: ${e}`), 
            () => {
                assert.sameMembers(output, [1, 2, 3, 4, 5], 'There should be right output')
                done()
            }
        )
    })

    it('should be able to execute two commands at the same time', (done) => {
        let output1 = [],
            output2 = [],
            startTime = new Date(),
            isOneDone,
            isTwoDone

        kaare2.registerCommand('range.delay',(max) => (Rx.Observable.range(1,max).map((v)=>(Rx.Observable.return(v).delay(100))).concatAll()))

        kaare1.executeCommand('range.delay',[5]).subscribe(
            v => output1.push(v),
            e => assert.fail(e, null, `There should be no error: ${e}`), 
            () => {
                assert.sameMembers(output1, [1, 2, 3, 4, 5], 'There should be right output')
                assert.closeTo(new Date().getTime() - startTime.getTime(),500,100,'Data should be returned in right time')
                isOneDone = isTwoDone ? done() : true
            }
        )

        kaare1.executeCommand('range.delay',[5]).subscribe(
            v => output2.push(v),
            e => assert.fail(e, null, `There should be no error: ${e}`), 
            () => {
                assert.sameMembers(output2, [1, 2, 3, 4, 5], 'There should be right output')
                assert.closeTo(new Date().getTime() - startTime.getTime(),500,100,'Data should be returned in right time')
                isTwoDone = isOneDone ? done() : true
            }
        )
    })

    it('should be able to transfer big amount of data', function(done) {
        this.timeout(4000)

        let maxSize = 70*1024, // This number would generate a bit less than 200KB request size
            string1 = new Array(maxSize).join('a'),
            string2 = new Array(maxSize).join('b')

        kaare2.registerCommand('concat',(params) => (Rx.Observable.return(params.join(''))))

        kaare1.executeCommand('concat',[string1,string2]).subscribe(
            v => assert.equal(v,string1+string2,'There should be right strings'),
            e => assert.fail(e, null, `There should be no error: ${e}`), 
            () => done()
        )
    })

    it('should be able to return errors when command is not found', (done) => {
        kaare1.executeCommand('range',[5]).subscribe(
            v => assert.fail(v, null, `There should be no value: ${v}`), 
            e => { 
                assert.instanceOf(e,Error,`There should be right error type: ${e}`) 
                assert.include(e.message,'cannot be found',`Error should tell that command cannot be found: ${e}`) 
                done() 
            },
            () => assert.fail(null, null, `Completed should never be called`)
        )
    })

    it('should be able to return custom errors', (done) => {
        kaare2.registerCommand('custError',() => (Rx.Observable.throw(new MyError('Hello'))))
        kaare1.executeCommand('custError').subscribe(
            v => assert.fail(v, null, `There should be no value: ${v}`), 
            e => { 
                assert.instanceOf(e,MyError,`There should be right error type: ${e}`) 
                assert.equal(e.message,'Hello',`Error should have a right message: ${e}`) 
                done() 
            },
            () => assert.fail(null, null, `Completed should never be called`)
        )
    })

     it('should be able to return type errors', (done) => {
        kaare2.registerCommand('custError',() => (undeclared_variable)) //jshint ignore:line
        kaare1.executeCommand('custError').subscribe(
            v => assert.fail(v, null, `There should be no value: ${v}`), 
            e => { 
                assert.instanceOf(e,ReferenceError,`There should be right error type: ${e}`) 
                assert.include(e.message,'undeclared_variable',`Error should have a right message: ${e}`) 
                done() 
            },
            () => assert.fail(null, null, `Completed should never be called`)
        )
    })
})
