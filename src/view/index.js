import * as THREE from "three"
import {
    MIN_ATTACH_DISTANCE,
    MIN_SPLIT_DISTANCE,
    MIN_VIEW_DISTANCE,
    childPartTypes,
    MAX_LEVEL,
} from "../config"
import {
    calDisInScreen,
    getDropFoot,
    getVecLength,
    isSquareOutOfScreen,
} from "../util"

const MIN_LEVEL_WIDTH = 1 / Math.pow(2, MAX_LEVEL)

class Node {
    constructor(x = 0, y = 0, z = 0, uuid = 0) {
        Object.assign(this, { x, y, z, uuid })
    }
}

class Part {
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
            return (this.childParts[type] = new Part(this.level + 1, bound))
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

function needSplit(part, minViewDis, camera) {
    // const C = 1
    // const pt1 = [-0.3, 0.2]
    // const pt2 = [0.2, 0.2]
    // const r1 = 0.5
    // const r2 = 0.1
    // const offsetX1 = part.centerX - pt1[0]
    // const offsetY1 = part.centerY - pt1[1]
    // const offsetX2 = part.centerX - pt2[0]
    // const offsetY2 = part.centerY - pt2[1]
    // const dis1 = Math.sqrt(offsetX1 * offsetX1 + offsetY1 * offsetY1)
    // const dis2 = Math.sqrt(offsetX2 * offsetX2 + offsetY2 * offsetY2)
    // const { farthestLine } = part
    // if (!farthestLine) return false
    // return getVecLength(...farthestLine) * ((C * r1) / dis1) > 0.01
    const { position } = camera
    const center = new THREE.Vector3(part.centerX, 0, part.centerY)
    return (
        Math.pow(10, center.distanceTo(position)) /
            (part.bound[2] - part.bound[0]) <
        minViewDis
    )
}

export class QuadTree {
    constructor(nodesBuffer = []) {
        this._rootPart = new Part(0)
        this._uuid = 0
        this._nodes = []
        this.init(nodesBuffer)
    }
    init(nodesBuffer) {
        this.initNodes(nodesBuffer)
        this._rootPart.includingNodes = [this._nodes]
        this.findAllIntersectNodes(this._rootPart)
    }
    // 将点的Buffer数据转化为真正的点并存储起来
    initNodes(nodesBuffer) {
        nodesBuffer.map((node) => {
            this._nodes.push(new Node(node[0], node[1], 0, this._uuid++))
        })
    }
    traverseValidNodes(nodeLists, cb) {
        nodeLists.map((nodeList, i) => {
            nodeList.map((node, index) => {
                let nextNode =
                    index > nodeList.length ? null : nodeList[index + 1]
                cb({
                    node,
                    index,
                    nodeList,
                    nextNode,
                })
            })
        })
    }
    composeNodes(startNode, endNode, nodes) {
        if (startNode) {
            nodes.unshift(startNode)
        }
        if (endNode) {
            nodes.push(endNode)
        }
        return nodes
    }
    // 1.找到线数据与全部层级的交点
    // 2.找到每一层最远的点对，并且存储下来
    findAllIntersectNodes(part) {
        if (part.level > MAX_LEVEL) return
        let [startIndex, childpartType] = [
            0,
            part.nodeInWhichChildPart(part.includingNodes[0][0]),
        ]
        let [startNode, endNode] = [null, null]
        let { centerX, centerY } = part
        let maxDis = -Infinity
        let maxDisNodes = []
        this.traverseValidNodes(
            part.includingNodes,
            ({ node, index, nodeList, nextNode }) => {
                if (index === 0) startIndex = 0
                // 如果是最后的点，则直接进行子区域判断
                if (!nextNode) {
                    endNode = null
                    part.getChildPart(childpartType).includingNodes.push(
                        this.composeNodes(
                            startNode,
                            endNode,
                            nodeList.slice(startIndex)
                        )
                    )
                    return
                }
                // 找最远的点对
                let node1 = nodeList[0]
                let node2 = nodeList[nodeList.length - 1]
                let dropFoot = getDropFoot(
                    node1.x,
                    node1.y,
                    node2.x,
                    node2.y,
                    node.x,
                    node.y
                )
                let dis = getVecLength(dropFoot[0], dropFoot[1], node.x, node.y)
                if (dis > maxDis) {
                    maxDis = dis
                    maxDisNodes = [dropFoot[0], dropFoot[1], node.x, node.y]
                }
                // 判断该点与下一点的连线是否构成交点，如果是，则
                // 1.找到该交点
                // 2.标记该点为交点
                // 3.判断下一点在哪个子区域内
                //      * 原子区域的includingNodes增加[startIndex,index]的部分
                //      * 重置startIndex,endIndex,childpartType
                if (
                    (centerX - node.x) * (centerX - nextNode.x) < 0 ||
                    (centerY - node.y) * (centerY - nextNode.y) < 0
                ) {
                    let intersectNode = this.findIntersectNode({
                        centerX,
                        centerY,
                        node,
                        nextNode,
                    })
                    part.intersectNodes.push(intersectNode)
                    endNode = intersectNode
                    part.getChildPart(childpartType).includingNodes.push(
                        this.composeNodes(
                            startNode,
                            endNode,
                            nodeList.slice(startIndex, index + 1)
                        )
                    )
                    startIndex = index + 1
                    childpartType = part.nodeInWhichChildPart(nextNode)
                    startNode = intersectNode
                }
            }
        )
        // 将最远的点对赋值到当前Part上
        // if (maxDisNodes.length === 0) throw "没有找到最远点对"
        part.farthestLine = maxDisNodes
        childPartTypes.map((childpartType) => {
            if (part.childParts[childpartType]) {
                this.findAllIntersectNodes(part.childParts[childpartType])
            }
        })
    }
    findIntersectNode({ centerX, centerY, node, nextNode }) {
        let k = (nextNode.y - node.y) / (nextNode.x - node.x)
        let b = nextNode.y - k * nextNode.x

        if ((centerX - node.x) * (centerX - nextNode.x) < 0) {
            return new Node(
                centerX,
                k * centerX + b,
                0,
                (node.uuid + nextNode.uuid) / 2
            )
        } else if ((centerY - node.y) * (centerY - nextNode.y) < 0) {
            if (isNaN(k) || k === 0 || !isFinite(k)) {
                return new Node(
                    node.x,
                    centerY,
                    0,
                    (node.uuid + nextNode.uuid) / 2
                )
            } else {
                return new Node(
                    (centerY - b) / k,
                    centerY,
                    0,
                    (node.uuid + nextNode.uuid) / 2
                )
            }
        } else {
            throw "计算交点时发生错误"
        }
    }
    // 对外暴露的traverse接口，用于遍历整个四叉树
    traverse(drawCb, drawHintCb, camera, minViewDis) {
        return sub.call(this, this._rootPart)
        function sub(part) {
            // 如果整个边界都处于视野外，则没有必要计算和渲染
            if (isSquareOutOfScreen(part.bound, camera)) {
                console.log("节省效率")
                return []
            }
            drawCb(part.bound)

            let res = part.intersectNodes
            if (needSplit(part, minViewDis, camera)) {
                childPartTypes.map((type) => {
                    part.childParts[type] &&
                        (res = res.concat(sub(part.childParts[type])))
                })
            }

            // 最后输出的结果需要排序并且组织成buffer的形式
            if (part.level === 0) {
                res = res
                    .concat([
                        this._nodes[0],
                        this._nodes[this._nodes.length - 1],
                    ])
                    .sort((a, b) => a.uuid - b.uuid)
            }

            return res
        }
    }
}
