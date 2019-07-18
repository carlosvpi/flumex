# flumex
Utility library for observables

## Install

## Flumex class

```new Flumex(set: T -> Nil, close: T -> Nil): Flumex T```

```type Next T = {value: T, done: Bool}```

## Methods

### flumex.next

Promise to be resolved with the next value of the flumex

```flumex.next(): Next T```

### flumex.close

Closes the flumex

```flumex.close(T): Nil```

### flumex.forEach

Perform an operation for every value of the flumex

```flumex.forEach(f: Next T -> Nil): Nil```

### flumex.map

Get another flumex whose values are the result of applying a function over the values of this flumex

```flumex.map(f: T -> Q): Flumex Q```

### flumex.filter

Get another flumex whose values are only the values of this flumex that fulfill certain predicate

```flumex.filter(p: T -> Bool): Flumex T```

### flumex.concat

Get another flumex whose values are those of a list of flumexes, taken in order (it only produces the values of flumex _i + 1_ when flumex _i_ is done)

```flumex.concat(flumexes: [Flumex T]): Flumex T```

### flumex.compact

Get another flumex whose values are only the values of this flumex that aren't null or undefined

```flumex.compact(): Flumex T```

### flumex.reject

Get another flumex whose values are only the values of this flumex that do not fulfill certain predicate

```flumex.filter(p: T -> Bool): Flumex T```

### flumex.reduce

```flumex.reduce(f: (Q, T) -> Q, init: Q): Flumex Q```

### flumex.mergeRace

```flumex.mergeRace(flumexes: [Flumex T]): Flumex T```

### flumex.mergeAll

```flumex.mergeAll(flumexes: [Flumex T]): Flumex T```

## Class methods

## every

```every(flumexes: [Flumex T]): Flumex [T]```

## some

```some(flumexes: [Flumex T]): Flumex [T]```

## fromInterval

```fromInterval(interval: Number): Flumex Number```

## fromSetter

```fromSetter(): [Flumex T, T -> Nil, T -> Nil]```

## fromEvent

```fromEvent(node: Node, event: String, useCapture: Bool): Flumex Event```

## fromFetch

```fromFetch(url: String, Options: Any): [Flumex Any, Nil -> Nil]```
