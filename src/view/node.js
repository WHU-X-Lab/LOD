export default class Node {
    constructor(x = 0, y = 0, z = 0, uuid = 0) {
        Object.assign(this, { x, y, z, uuid })
    }
}
