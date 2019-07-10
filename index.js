const noop = () => {}

function Stream (init) {
    this.value = init
    this.done = false
    this.cancel = noop
    this.closing = false
    this.subscriptions = []
}

Stream.prototype.next = function () {
    return new Promise((resolve) => {
        if (!this.subscriptions.includes(resolve)) {
            this.subscriptions.push(resolve)
        }
    })
}

Stream.prototype.set = function (value) {
    if (this.done) {
        return
    }
    if (this.closing) {
        this.done = true
        this.cancel()
        this.closing = false
    }
    this.value = value
    this.subscriptions.forEach((resolve) => {
        resolve({ value: this.value, done: this.done })
    })
    this.subscriptions = []
}

Stream.prototype.close = function (value) {
    this.closing = true
}

Stream.fromInterval = (interval) => {
    const s = new Stream()
    let i = 0
    const token = setInterval(() => {
        s.set(i++)
    }, interval)
    s.cancel = () => clearInterval(token)
    setTimeout(s.cancel, 10000)
    return s
}

Stream.prototype.forEach = async function (f) {
    while (await this.next() && !this.done) {
        f(this)
    }
    f(this)
}

Stream.prototype.map = function (f) {
    const s = new Stream()
    this.forEach(({ value, done }) => {
        debugger
        if (done) {
            s.close(f(value))
        } else {
            s.set(f(value))
        }
    })
    return s
}

f = async (stream) => {
    let value, done
    do {
        const next = await stream.next()
        value = next.value
        done = next.done
        if (value >= 3) {
            stream.close()
        }
        console.log(value)
    } while (!done)
}

g = async (stream) => {
    let value, done
    do {
        const next = await stream.next()
        value = next.value
        done = next.done
        console.log('party continues')
    } while (!done)
    console.log('Party has finished!! :(')
}

s = Stream.fromInterval(1000)
// f(s)
// g(s)
f(Stream.fromInterval(1000).map(x => x * 2))