const noop = () => {}

function Flumex (generator, cancel = noop, defaultValue) {
    this.value = defaultValue
    this.done = false
    this.closing = false
    this.subscriptions = []
    this.set = (value) => {
        if (this.done) {
            return
        }
        if (this.closing) {
            this.done = true
            cancel(this.set)
            this.closing = false
        }
        this.value = value
        this.subscriptions.forEach((resolve) => {
            resolve({ value: this.value, done: this.done })
        })
        this.subscriptions = []
    }
    this.cancel = cancel.bind(this, this.set)
    generator(this.set, () => this.closing = true)
}

Flumex.prototype.add = function (flumex) {
    flumex.forEach(({ value }) => {
        this.set(value)
    })
}
Flumex.prototype.next = function () {
    return new Promise((resolve) => {
        if (!this.subscriptions.includes(resolve)) {
            this.subscriptions.push(resolve)
        }
    })
}

Flumex.prototype.close = function (value) {
    this.closing = true
}

Flumex.prototype.default = function (value) {
    this.value = value
    return this
}
Flumex.prototype.forEach = function (f) {
    return Flumex.forEach(f)(this)
}
Flumex.forEach = (f) => (flumex) => {
    let proceed = true
    const next = () => {
        flumex.next().then(() => {
            if (proceed) {
                f(flumex)
                next()
            }
        })
    }
    next()
    return () => proceed = false
}

Flumex.prototype.map = function (f) {
    return Flumex.map(f)(this)
}
Flumex.map = (f) => (flumex) => {
    return new Flumex((set, close) => {
        flumex.forEach(({ value, done }) => {
            if (done) {
                close(f(value))
            } else {
                set(f(value))
            }
        })
    }, () => flumex.cancel())
}

Flumex.prototype.filter = function (p) {
    return Flumex.filter(p)(this)
}
Flumex.filter = (p) => (flumex) => {
    return new Flumex((set, close) => {
        flumex.forEach(({ value, done }) => {
            if (done) {
                close(p(value) ? value : undefined)
            } else if (p(value)) {
                set(value)
            }
        })
    })
}

Flumex.prototype.concat = function (...flumexes) {
    return Flumex.concat(this, ...flumexes)
}
Flumex.concat = (...flumexes) => {
    const subscribe = (index) => {
        const isLast = index === flumexes - 1

        return (set, close) => {
            flumexes[index].forEach(({ value, done }) => {
                if (done) {
                    if (isLast) {
                        close(value)
                    } else {
                        subscribe(index + 1)(set, close)
                    }
                } else {
                    set(value)
                }
            })
        }
    }
    return new Flumex(subscribe(0))
}

Flumex.prototype.compact = function () {
    return Flumex.compact(this)
}
Flumex.compact = (() => {
    const nil = (x) => x === null || x === undefined
    return () => Flumex.reject(nil)
})()

Flumex.prototype.reject = function (p) {
    return Flumex.reject(p)(this)
}
Flumex.reject = (p) => (flumex) => {
    return new Flumex((set, close) => {
        flumex.forEach(({ value, done }) => {
            if (done) {
                close(!p(value) ? value : undefined)
            } else if (!p(value)) {
                set(value)
            }
        })
    })
}

Flumex.prototype.reduce = function (f, init) {
    return Flumex.reduce(f, init)(this)
}
Flumex.reduce = (f, init) => (flumex) => {
    const reduction = new Flumex((set, close) => {
        let acc = init
        flumex.forEach(({ value, done }) => {
            acc = f(acc, value)
            if (done) {
                close(acc)
            } else {
                set(acc)
            }
        })
    })
    reduction.value = init
    return reduction
}
Flumex.prototype.mergeRace = function (...flumexes) {
    return Flumex.mergeRace(this, ...flumexes)
}
Flumex.mergeRace = (...flumexes) => {
    return new Flumex((set, close) => {
        flumexes.forEach((flumex) => {
            flumex.forEach(({ value, done }) => {
                if (done) {
                    close(value)
                } else {
                    set(value)
                }
            })
        })
    })
}
Flumex.prototype.mergeAll = function (...flumexes) {
    return Flumex.mergeAll(this, ...flumexes)
}
Flumex.mergeAll = (...flumexes) => {
    return new Flumex((set, close) => {
        flumexes.forEach((flumex) => {
            flumex.forEach(({ value, done }) => {
                const areAllDone = flumexes.reduce((acc, { done }) => acc && done, true)
                if (areAllDone) {
                    close(value)
                } else {
                    set(value)
                }
            })
        })
    }, () => {
        flumexes.forEach((flumex) => flumex.cancel())
    }, flumexes[0].value)
}

Flumex.every = (...flumexes) => {
    return new Flumex((set, close) => {
        flumexes.forEach((flumex) => {
            flumex.forEach(({ value, done }) => {
                const allValues = flumexes.map(({ value }) => value)
                const allDone = flumexes.reduce((acc, { done }) => acc && done, true)
                if (allDone) {
                    close(allValues)
                } else {
                    set(allValues)
                }
            })
        })
    })
}

Flumex.some = (...flumexes) => {
    return new Flumex((set, close) => {
        flumexes.forEach((flumex) => {
            flumex.forEach(({ value, done }) => {
                const allValues = flumexes.map(({ value }) => value)
                const someDone = flumexes.reduce((acc, { done }) => acc || done, false)
                if (someDone) {
                    close(allValues)
                } else {
                    set(allValues)
                }
            })
        })
    })
}

// Flumex.combineAll = (collection) => {
// }
Flumex.combineRace = (collection) => {
    const flumexes = Array.isArray(collection)
        ? collection.filter(item => item.constructor === Flumex)
        : Object.keys(collection)
            .map((key) => collection[key])
            .filter(item => item.constructor === Flumex)
    return new Flumex((set, close) => {
        flumexes.forEach((item) => {
            item.forEach(() => {
                if (item.done) {
                    close(collection)
                } else {
                    set(collection)
                }
            })
        })
    }, () => flumexes.forEach((item) => item.cancel()), collection)
}

Flumex.fromInterval = (interval, cleanAfter = 10000) => {
    let i = 0
    let token
    const s = new Flumex((set) => {
        token = setInterval(() => {
            set(i++)
        }, interval)
    }, () => clearInterval(token))
    cleanAfter && setTimeout(s.cancel, cleanAfter)
    return s
}

Flumex.fromSetter = (f) => {
    let setFlumex, closeFlumex
    const flumex = new Flumex((set, close) => {
        setFlumex = set
        closeFlumex = close
    })
    return [flumex, setFlumex, closeFlumex]
}

Flumex.fromEvent = (node, eventName, useCapture) => {
    return new Flumex((set) => {
        node.addEventListener(eventName, set, useCapture)
    }, (set) => {
        node.removeEventListener(eventName, set, useCapture)
    })
}

Flumex.fromFetch = (url, options) => {
    let fetcher
    const flumex = new Flumex((set) => {
        fetcher = async (newOptions) => {
            options = {
                ...options,
                newOptions
            }
            set(await fetch(url, options))
        }
    })
    return [flumex, fetcher]
}

f = async (flumex) => {
    let value, done
    do {
        const next = await flumex.next()
        value = next.value
        done = next.done
        if (value >= 3) {
            flumex.close()
        }
        console.log(value)
    } while (!done)
}

g = async (flumex) => {
    let value, done
    do {
        const next = await flumex.next()
        value = next.value
        done = next.done
        console.log('party continues')
    } while (!done)
    console.log('Party has finished!! :(')
}

// s = Flumex.fromInterval(1000).map(x => x * 2)
// f(s)
// g(s)
