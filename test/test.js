// async function foo() {
//     await console.log(100)
//     console.log(a)
// }
// foo()
// console.log(2)

// let o = { [Symbol("a")]: 1 }
// console.log(o[Symbol("a")])
let o = {
    [Symbol.iterator]: function*() {
        yield 1
        yield 2
    }
}
for (let i of o) {
    console.log(i)
}
