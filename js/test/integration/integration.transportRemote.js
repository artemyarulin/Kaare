describe('Transport.Remote', () => {
    let kaare1,
        kaare2

    let cleanup = () => {
        if (kaare1) kaare1.transport.stop()
        if (kaare2) kaare2.transport.stop()
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

    it('should be able to run code remotely', (done) => {
        kaare1.executeCommand('1+1').subscribe(
            v => assert.equal(v, 2, 'There should be right value'),
            e => assert.fail(e, null, `There should be no error: ${e}`), () => done())
    })

    it('should be able to return errors', (done) => {
        kaare1.executeCommand('1 1').subscribe(
            v => assert.fail(v, null, 'There should be no value'),
            e => {
                assert.include(e, 'SyntaxError', 'There should be SyntaxError');
                done()
            })
    })

    it('should be able to return observables', (done) => {
        let output = []
        kaare1.executeCommand('Rx.Observable.range(1,5)').subscribe(
            v => output.push(v),
            e => assert.fail(e, null, `There should be no error: ${e}`), 
            () => {
                assert.sameMembers(output, [1, 2, 3, 4, 5], 'There should be right output')
                done()
            })
    })

    it('should be able to return observables with params', (done) => {
        let output = []
        kaare1.executeCommand('Rx.Observable.range',[1,5]).subscribe(
            v => output.push(v),
            e => assert.fail(e, null, `There should be no error: ${e}`), 
            () => {
                assert.sameMembers(output, [1, 2, 3, 4, 5], 'There should be right output')
                done()
            })
    })

    it('should be able to find function in global context', (done) => {
        let output = []
        window.range = (max) => (Rx.Observable.range(1,max)) //jshint ignore:line
        
        kaare1.executeCommand('range',[5]).subscribe(
            v => output.push(v),
            e => assert.fail(e, null, `There should be no error: ${e}`), 
            () => {
                assert.sameMembers(output, [1, 2, 3, 4, 5], 'There should be right output')
                done()
            })
    })
})
