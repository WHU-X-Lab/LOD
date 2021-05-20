import { childPartTypes } from "../config"
export default class Part {
    constructor(level = 0, bound = [-0.5, -0.5, 0.5, 0.5]) {
        this.level = level
        this.bound = bound
        this.centerX = (bound[0] + bound[2]) / 2
        this.centerY = (bound[1] + bound[3]) / 2
        this.intersectNodes = []
        this.includingNodes = []
        this.childParts = {
            tl: null,
            tr: null,
            bl: null,
            br: null,
        }
        this.farthestLine = null
        this.parent = null
    }
    getChildPart(type) {
        if (!childPartTypes.includes(type)) {
            throw Error("Wrong childpart type")
        }
        if (!this.childParts[type]) {
            let bound = []
            if (type === "bl") {
                bound = [
                    this.bound[0],
                    this.bound[1],
                    this.centerX,
                    this.centerY,
                ]
            } else if (type === "tl") {
                bound = [
                    this.bound[0],
                    this.centerY,
                    this.centerX,
                    this.bound[3],
                ]
            } else if (type === "br") {
                bound = [
                    this.centerX,
                    this.bound[1],
                    this.bound[2],
                    this.centerY,
                ]
            } else if (type === "tr") {
                bound = [
                    this.centerX,
                    this.centerY,
                    this.bound[2],
                    this.bound[3],
                ]
            }
            this.childParts[type] = new Part(this.level + 1, bound)
            this.childParts[type].parent = this
            return this.childParts[type]
        } else {
            return this.childParts[type]
        }
    }
    nodeInWhichChildPart(node) {
        if (node.x <= this.centerX && node.y <= this.centerY) {
            return "bl"
        } else if (node.x <= this.centerX && node.y >= this.centerY) {
            return "tl"
        } else if (node.x >= this.centerX && node.y <= this.centerY) {
            return "br"
        } else if (node.x >= this.centerX && node.y >= this.centerY) {
            return "tr"
        } else {
            debugger
            throw Error("No childparts matched")
        }
    }
}
