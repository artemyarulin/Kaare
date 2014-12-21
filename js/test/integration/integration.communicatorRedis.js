describe('Transport.Remote Redis communicator', () => {
    it('should be able to subscribe and publish', (done) => {
        let key = 'integrationTests',
            data = {
                'hello': 'world'
            },
            comm = new Kaare.transports.Remote.RedisCommunicator('http://localhost:7379')

        comm.subscribe(key).subscribe((incData) => {
                assert.deepEqual(incData, data, 'Incoming data should be equal to what was published')
                done()
            },
            err => assert.fail(`There should be no error upon subscribing: ${err}`))

        setTimeout(() => comm.publish(key, data), 10) // Give subscriber some time to connect to the server
    })
})
