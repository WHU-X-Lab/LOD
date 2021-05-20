class Node {
    constructor(data, next = null) {
        Object.assign(this, { data, next })
    }
}

export default class Queue {
    constructor() {
        this.head = null
        this.tail = null
    }
    getTail(list) {
        let node = list.head
        while (node && node.next) {
            node = node.next
        }
        return node
    }
    enqueue(n) {
        let newNode = new Node(n)
        if (!this.head) {
            this.head = this.tail = newNode
        } else {
            newNode.next = this.tail.next
            this.tail.next = newNode
            this.tail = newNode
        }
    }
    dequeue() {
        let res = this.head
        if (this.head === this.tail) {
            this.head = this.tail = null
        } else {
            this.head = this.head.next
            res.next = null
        }
        return res
    }
    isEmpty() {
        return this.head === null
    }
    list() {
        let node = this.head
        while (node) {
            console.log(node.data)
            node = node.next
        }
    }
}
