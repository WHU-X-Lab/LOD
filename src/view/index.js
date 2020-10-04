const isOdd = num => num & 1

const emptyHandler = () => true

/**
 * Class Part refers to a struct like this
 *
 * It has 5 childNodes(top-left,top-right,bottom-left,bottom-right,center)
 *        4 childParts(top-left,top-right,bottom-left,bottom-right)
 *        segments
 *
 * *-------------------*
 * |         |         |
 * |   tl    |   tr    |
 * |         |         |
 * |---------*---------|
 * |         |         |
 * |   bl    |   br    |
 * |         |         |
 * *-------------------*
 * |<---segments---->|
 */

class Part {
    constructor({
        type = "default",
        segments = "",
        parent = null,
        root = null
    }) {
        this.type = type
        this.segments = segments
        this.parent = parent
        this.root = root
        this.childSegments = (segments + 1) / 2

        let [startX, startY, endX, endY] = this.computeCoord()
        Object.assign(this, { startX, startY, endX, endY })

        this.centerX = (this.startX + this.endX) / 2
        this.centerY = (this.startY + this.endY) / 2

        this.childNodes = { center: 0, tl: 0, tr: 0, bl: 0, br: 0 }
        this.childParts = {}
        this.childPartTypes = ["tl", "tr", "bl", "br"]
        this.childNodeTypes = [...this.childPartTypes, "center"]
    }
    computeCoord() {
        const isLeft = this.type === "tl" || this.type === "bl"
        const isRight = this.type === "tr" || this.type === "br"
        const isTop = this.type === "tl" || this.type === "tr"
        const isBottom = this.type === "bl" || this.type === "br"
        const isDefault = this.type === "default"
        const width = this.segments - 1
        let parent = this.parent

        if (isDefault) {
            return [0, 0, width, width]
        } else {
            let startX = isLeft ? parent.startX : parent.startX + width
            let startY = isTop ? parent.startY : parent.startY + width
            let endX = isRight ? parent.endX : parent.endX - width
            let endY = isBottom ? parent.endY : parent.endY - width
            return [startX, startY, endX, endY]
        }
    }
    addNode(type, height) {
        if (!this.childNodeTypes.includes(type)) return
        this.childNodes[type] = height
    }
    addPart(type) {
        if (!this.childPartTypes.includes(type)) return
        return (this.childParts[type] = new Part({
            type,
            segments: this.childSegments,
            parent: this,
            root: this.root
        }))
    }
    clear() {
        let { startX, startY, endX, endY, root, segments } = this

        for (let i = startX; i < endX; i++) {
            for (let j = startY; j < endY; j++) {
                let index = i + j * segments
                root[index] = 0
            }
        }
        console.log(`clear done\n`)
        console.log(root)
    }
}

export class QuadTree {
    constructor(nodes = [], visibleFn = emptyHandler) {
        Object.assign(this, { nodes, visibleFn })
        this.rootSegments = Math.sqrt(nodes.length)
        if (!isOdd(this.rootSegments)) throw "Quadtree's length must be Odd"

        this.root = new Part({ segments: this.rootSegments, root: this.nodes })
        this.init()
    }
    init() {
        let self = this
        this.nodes.map((node, index) => {
            self.addNode.call(self, node, index)
        })
    }
    addNode(node, index) {
        let part = this.root

        let x = index % 3
        let y = Math.floor(index / 3)

        while (part.segments > 1) {
            let { startX, startY, endX, endY, centerX, centerY } = part

            // patch node
            if (x === startX && y === startY) {
                part.addNode("tl", node)
                break
            } else if (x === startX && y === endY) {
                part.addNode("bl", node)
                break
            } else if (x === centerX && y === centerY) {
                part.addNode("center", node)
                break
            } else if (x === endX && y === startY) {
                part.addNode("tr", node)
                break
            } else if (x === endX && y === endY) {
                part.addNode("br", node)
                break
            } else if (x <= centerX && y <= centerY) {
                part = part.addPart("tl")
            } else if (x <= centerX && y >= centerY) {
                part = part.addPart("bl")
            } else if (x >= centerX && y <= centerY) {
                part = part.addPart("tr")
            } else if (x >= centerX && y >= centerY) {
                part = part.addPart("br")
            }
        }
    }
    traverse(part = this.root, fn = this.traverse, visFn = this.visibleFn) {
        if (visFn(part.childNodes["center"])) {
            part.childPartTypes.map(partType => {
                let childPart = part.childParts[partType]
                if (childPart) {
                    fn.call({}, childPart, fn, visFn)
                }
            })
        } else {
            part.clear()
        }
    }
}

// let nodes = [1, 2, 3, 0, 0, 2, 0, 0, 1]
// let quadtree = new QuadTree(nodes)
// quadtree.traverse()
