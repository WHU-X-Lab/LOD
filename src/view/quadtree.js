import * as THREE from "three"
import {
    MIN_ATTACH_DISTANCE,
    MIN_VEC_DISTANCE,
    MIN_VIEW_DISTANCE,
    childPartTypes,
    MAX_LEVEL,
} from "../config"
import { calDisInScreen, getDropFoot, getVecLength } from "../util"

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
        this.farthestLine = null
        this.needSplit = false
    }
    addNode(node) {
        if (this.level > MAX_LEVEL) return
        if (this.isNodeBelongPart(node)) {
            this.nodes.push(node)
        }
        let childParts = this.addChildPart(node)
        childParts.map((childPart) => {
            childPart.addNode(node)
        })
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
        let childParts = []
        if (
            node.x <= midX + MIN_ATTACH_DISTANCE &&
            node.y <= midY + MIN_ATTACH_DISTANCE
        ) {
            childParts.push(
                this.childParts["bl"] ||
                    this.createChildPart("bl", [
                        this.bound[0],
                        this.bound[1],
                        midX,
                        midY,
                    ])
            )
        }
        if (
            node.x <= midX + MIN_ATTACH_DISTANCE &&
            node.y > midY - MIN_ATTACH_DISTANCE
        ) {
            childParts.push(
                this.childParts["tl"] ||
                    this.createChildPart("tl", [
                        this.bound[0],
                        midY,
                        midX,
                        this.bound[3],
                    ])
            )
        }
        if (
            node.x >= midX - MIN_ATTACH_DISTANCE &&
            node.y <= midY + MIN_ATTACH_DISTANCE
        ) {
            childParts.push(
                this.childParts["br"] ||
                    this.createChildPart("br", [
                        midX,
                        this.bound[1],
                        this.bound[2],
                        midY,
                    ])
            )
        }
        if (
            node.x >= midX - MIN_ATTACH_DISTANCE &&
            node.y > midY - MIN_ATTACH_DISTANCE
        ) {
            childParts.push(
                this.childParts["tr"] ||
                    this.createChildPart("tr", [
                        midX,
                        midY,
                        this.bound[2],
                        this.bound[3],
                    ])
            )
        }
        return childParts
    }
    createChildPart(childPartType, bound) {
        if (!childPartTypes.includes(childPartType)) {
            throw new Error("Wrong childpart type")
        }
        return (this.childParts[childPartType] = new Part(
            this.level + 1,
            bound
        ))
    }
    traverse(drawCb, drawHintCb, camera) {
        return traverseSub.call(this)

        function isViewValid() {
            if (this.level <= 0) return true
            if()
            return this.level < 5
        }
        function traverseSub() {
            if (!isViewValid.call(this, camera)) return this.nodes
            let res = this.nodes
            childPartTypes.map((type) => {
                let childPart = this.childParts[type]
                if (childPart) {
                    res = res.concat(traverseSub.call(childPart))
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
        this.findFarNode(this.root)
    }
    addNode(node) {
        this.root.addNode(node)
    }
    // 遍历根结点，找到每一层最远的点对，并存储下来
    findFarNode(part) {
        part.nodes = part.nodes.sort((a, b) => a.uuid - b.uuid)
        // 剔除非常相邻的点
        let currNode = part.nodes[0]
        let validNodes = part.nodes.reduce(
            (prev, curr) => {
                if (
                    getVecLength(currNode.x, currNode.y, curr.x, curr.y) >
                    MIN_VIEW_DISTANCE * Math.pow(0.5, part.level)
                ) {
                    currNode = curr
                    return prev.concat(curr)
                } else {
                    return prev
                }
            },
            [currNode]
        )
        // 如果仅存在一个有效点，则直接返回空，表示该区域内无任何点
        if (validNodes.length === 1) {
            return []
        }
        // 如果仅存在两个有效点，则记录下最远垂距,并且返回其子区域内的点
        if (validNodes.length === 2) {
            let allNodes = childPartTypes.reduce((nodes, type) => {
                if (part.childParts[type]) {
                    return nodes.concat(this.findFarNode(part.childParts[type]))
                } else {
                    return nodes
                }
            }, part.nodes)
            let maxDis = -Infinity
            let maxDisNodes = []
            let node1 = validNodes[0]
            let node2 = validNodes[1]
            allNodes.map((node) => {
                let dropFoot = getDropFoot(
                    node1.x,
                    node1.y,
                    node2.x,
                    node2.y,
                    node.x,
                    node.y
                )
                let dis = getVecLength(
                    dropFoot[0],
                    dropFoot[1],
                    node[0],
                    node[1]
                )
                if (dis > maxDis) {
                    maxDis = dis
                    maxDisNodes = [dropFoot[0], dropFoot[1], node[0], node[1]]
                }
            })
            part.farthestLine = maxDisNodes
            return allNodes
        }
        // 如果存在不止两个有效点，则继续剖分，并且将Part标记为需要分裂,并且返回其子区域内的点
        if (validNodes.length > 2) {
            part.needSplit = true
            return childPartTypes.reduce((nodes, type) => {
                if (part.childParts[type]) {
                    return nodes.concat(this.findFarNode(part.childParts[type]))
                } else {
                    return nodes
                }
            }, part.nodes)
        }
    }
    traveseTree(...args) {
        return this.root.traverse(...args)
    }
}
