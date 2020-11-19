import * as THREE from "three"
import {
    MIN_ATTACH_DISTANCE,
    MIN_VEC_DISTANCE,
    childPartTypes,
    MAX_LEVEL,
} from "../config"
import { calDisInScreen } from "../util"

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
            let maxDis = -Infinity
            let childNodes = []
            let maxDisNodeCombinationCoords = [] // 存储最长投影距离点及其投影点
            childPartTypes.map((childPartType) => {
                if (this.childParts[childPartType]) {
                    childNodes = childNodes.concat(
                        this.childParts[childPartType].nodes
                    )
                }
            })
            for (let i = 0; i < this.nodes.length - 1; i++) {
                let x1 = this.nodes[i].x
                let y1 = this.nodes[i].y
                let x2 = this.nodes[i + 1].x
                let y2 = this.nodes[i + 1].y
                // 如果两个点的视觉距离特别短，就不计算了，避免精度导致的误差
                if (
                    calDisInScreen(x1, y1, x2, y2, camera) < MIN_ATTACH_DISTANCE
                ) {
                    continue
                }
                // 计算每个子节点到父节点的垂距在视觉上的最长投影距离
                // x0,y0为子节点的坐标
                // x,y为投影点的坐标
                childNodes.map((childNode) => {
                    let x0 = childNode.x
                    let y0 = childNode.y
                    let k = (y2 - y1) / (x2 - x1)
                    if (!isNaN(k)) {
                        let x = (k * k * x1 + k * (y0 - y1) + x0) / (k * k + 1)
                        let y = k * (x - x1) + y1
                        let dis = calDisInScreen(x0, y0, x, y, camera)
                        if (dis > maxDis) {
                            maxDis = dis
                            maxDisNodeCombinationCoords = [x0, y0, x, y]
                            // let pt1 = getCoordInScreen(x0, y0, camera)
                            // let pt2 = getCoordInScreen(x, y, camera)
                            // maxDisNodeCombinationCoords = [
                            //     pt1.x,
                            //     pt1.y,
                            //     pt2.x,
                            //     pt2.y,
                            // ]
                        }
                    }
                })
            }
            // 绘制出断掉的点
            if (maxDis <= MIN_VEC_DISTANCE) {
                drawHintCb(...maxDisNodeCombinationCoords)
                // drawCb(this.bound)
                console.log(
                    `draw(${maxDisNodeCombinationCoords[0]},${maxDisNodeCombinationCoords[1]})to(${maxDisNodeCombinationCoords[2]},${maxDisNodeCombinationCoords[3]})`
                )
            }
            return maxDis > MIN_VEC_DISTANCE
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
    }
    addNode(node) {
        this.root.addNode(node)
    }
    traveseTree(...args) {
        return this.root.traverse(...args)
    }
}
