import * as THREE from "three"
import { calDisByCamera } from "../util"

const MIN_ATTACH_DISTANCE = 0.001
const MIN_VEC_DISTANCE = 0.2
const childPartTypes = ["tl", "tr", "bl", "br"]

class Node {
    constructor(x = 0, y = 0, z = 0, uuid = 0) {
        Object.assign(this, { x, y, z, uuid })
    }
}

class Part {
    constructor(level = 0, bound = [-0.5, -0.5, 0.5, 0.5]) {
        this.level = level
        this.bound = bound
        this.center = new THREE.Vector3(
            (bound[0] + bound[2]) / 2,
            0,
            (bound[1] + bound[3]) / 2
        )
        this.width = bound[2] - bound[0]
        this.nodes = []
        this.childParts = {
            tl: null,
            tr: null,
            bl: null,
            br: null,
        }
    }
    addNode(node) {
        this.nodes.push(node)
    }
    isNodeBelongPart(node) {
        return (
            (node.x + 0.5) % Math.pow(1 / 2, this.level) <=
                MIN_ATTACH_DISTANCE ||
            (node.y + 0.5) % Math.pow(1 / 2, this.level) <= MIN_ATTACH_DISTANCE
        )
    }
    addChildPart(node) {
        const midX = (this.bound[0] + this.bound[2]) / 2
        const midY = (this.bound[1] + this.bound[3]) / 2
        if (node.x <= midX && node.y <= midY) {
            return (
                this.childParts["bl"] ||
                this.createChildPart("bl", [
                    this.bound[0],
                    this.bound[1],
                    midX,
                    midY,
                ])
            )
        } else if (node.x <= midX && node.y > midY) {
            return (
                this.childParts["tl"] ||
                this.createChildPart("tl", [
                    this.bound[0],
                    midY,
                    midX,
                    this.bound[3],
                ])
            )
        } else if (node.x >= midX && node.y <= midY) {
            return (
                this.childParts["br"] ||
                this.createChildPart("br", [
                    midX,
                    this.bound[1],
                    this.bound[2],
                    midY,
                ])
            )
        } else if (node.x >= midX && node.y > midY) {
            return (
                this.childParts["tr"] ||
                this.createChildPart("tr", [
                    midX,
                    midY,
                    this.bound[2],
                    this.bound[3],
                ])
            )
        }
    }
    createChildPart(childPartType, bound) {
        if (!childPartTypes.includes(childPartType)) {
            console.log("Wrong childpart type")
            return false
        }
        return (this.childParts[childPartType] = new Part(
            this.level + 1,
            bound
        ))
    }
    traverse(level, drawCb, camera) {
        return traverseSub.call(this, level)

        function isViewValid() {
            if (this.level <= 1) return true
            let maxDis = -Infinity
            let childNodes = []
            childPartTypes.map((childPartType) => {
                if (this.childParts[childPartType]) {
                    childNodes.concat(this.childParts[childPartType].nodes)
                }
            })
            for (let i = 0; i < this.nodes.length - 1; i++) {
                let x1 = this.nodes[i].x
                let y1 = this.nodes[i].z
                let x2 = this.nodes[i + 1].x
                let y2 = this.nodes[i + 1].z
                // 计算每个子节点到父节点的垂距在视觉上的最长投影距离
                childNodes.map((childNode) => {
                    let x0 = childNode.x
                    let y0 = childNode.z
                    let k =
                        ((x0 - x1) * (x2 - x1) + (y0 - y1) * (y2 - y1)) /
                        ((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
                    let x = x1 + k * (x2 - x1)
                    let y = y1 + k * (y2 - y1)
                    let dis = calDisByCamera(x0, y0, x, y, camera)
                    maxDis = Math.max(dis, maxDis)
                })
            }
            return maxDis > MIN_VEC_DISTANCE
            // return (
            //     calDisByCamera(
            //         this.bound[0],
            //         this.bound[1],
            //         this.bound[2],
            //         this.bound[3],
            //         camera
            //     ) > MIN_VEC_DISTANCE
            // )
        }
        function traverseSub(level) {
            if (!isViewValid.call(this, camera)) return []
            let res = this.nodes

            childPartTypes.map((type) => {
                let childPart = this.childParts[type]
                if (childPart) {
                    res = res.concat(traverseSub.call(childPart, level))
                }
            })
            if (res.length > 0) drawCb(this.bound)
            if (this.level === 0) {
                res = res
                    .sort((a, b) => a.uuid - b.uuid)
                    .reduce((prev, curr) => {
                        return prev.concat([curr.x, curr.z, curr.y])
                    }, [])
            }
            return res
        }
    }
}

export class QuadTree {
    constructor(data) {
        this.root = new Part(0)
        this.uuid = 0
        for (let i = 0; i < data.length; i += 3) {
            this.addNode(
                new Node(data[i], data[i + 1], data[i + 2], this.uuid++)
            )
        }
    }
    addNode(node) {
        let part = this.root
        while (!part.isNodeBelongPart(node)) {
            part = part.addChildPart(node)
        }
        part.addNode(node)
    }
    traveseTreeByLevel(...args) {
        return this.root.traverse(...args)
    }
}
