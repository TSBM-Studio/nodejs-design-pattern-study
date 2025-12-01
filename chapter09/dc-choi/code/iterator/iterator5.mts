function * twoWayGenerator () {
    try {
        const what = yield null
        yield 'Hello ' + what
    } catch (err) {
        yield 'Hello error: ' + err.message
    }
}
console.log('Using throw():')
const twoWayException = twoWayGenerator()
twoWayException.next()
console.log(twoWayException.throw(new Error('Boom!')))
console.log('Using return():')
const twoWayReturn = twoWayGenerator()
console.log(twoWayReturn.return('myReturnValue'))