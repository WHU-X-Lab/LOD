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
        this.validIndexRanges = []
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
            throw Error("No childparts matched")
        }
    }
}

export class QuadTree {
    constructor(nodesBuffer = []) {
        this._rootPart = new Part(0)
        this._uuid = 0
        this._nodes = []
        this.init(nodesBuffer)
    }
    init(nodesBuffer) {
        this._rootPart.validIndexRanges = [[0, nodesBuffer.length - 1]]
        this.initNodes(nodesBuffer)
        this.findAllIntersectNodes(this._rootPart)
    }
    // 将点的Buffer数据转化为真正的点并存储起来
    initNodes(nodesBuffer) {
        nodesBuffer.map((node) => {
            this._nodes.push(new Node(node[0], node[1], 0, this._uuid++))
        })
    }
    traverseValidNodes(ranges, cb) {
        let { _nodes } = this
        ranges.map(([startIndex, endIndex]) => {
            if (
                typeof startIndex !== "undefined" &&
                typeof endIndex !== "undefined"
            ) {
                for (let i = startIndex; i <= endIndex; i++) {
                    cb(
                        _nodes[i],
                        i,
                        i + 1 > _nodes.length - 1 ? null : _nodes[i + 1],
                        [startIndex, endIndex]
                    )
                }
            } else {
                throw "错误的数组下标"
            }
        })
    }
    // 1.找到线数据与全部层级的交点
    // 2.找到每一层最远的点对，并且存储下来
    findAllIntersectNodes(part) {
        if (part.level > MAX_LEVEL) return
        let [startIndex, childpartType] = [
            part.validIndexRanges[0][0],
            part.nodeInWhichChildPart(this._nodes[part.validIndexRanges[0][0]]),
        ]
        let { centerX, centerY } = part
        let maxDis = -Infinity
        let maxDisNodes = []
        this.traverseValidNodes(
            part.validIndexRanges,
            (node, index, nextNode, [start, end]) => {
                // 如果是最后的点，则直接进行子区域判断
                if (index === 5) {
                    debugger
                }
                if (
                    index >=
                    part.validIndexRanges[part.validIndexRanges.length - 1][1]
                ) {
                    part.getChildPart(childpartType).validIndexRanges.push([
                        startIndex,
                        index,
                    ])
                    return
                }
                if (nextNode === null) throw "出现node下标越界情况"
                // 找最远的点对
                let node1 = this._nodes[start]
                let node2 = this._nodes[end]
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
                // 先判断点是否就在边界上,如果在,则
                // 1.标记该点为交点
                // 2.判断下一个点是否与之前的点不在一个子区域内
                //      如果是则
                //          * 原子区域的validIndexRanges增加[startIndex,index]的部分
                //          * 重置startIndex,endIndex,childpartType
                //      如果不是则继续
                if (node.x === centerX || node.y === centerY) {
                    part.intersectNodes.push(node)
                    let newChildpartType = part.nodeInWhichChildPart(nextNode)
                    if (newChildpartType !== childpartType) {
                        part.getChildPart(childpartType).validIndexRanges.push([
                            startIndex,
                            index,
                        ])
                        startIndex = index
                        childpartType = newChildpartType
                    }
                }
                // 再判断该点与下一点的连线是否构成交点，如果是，则
                // 1.找到该交点
                // 2.标记该点为交点
                // 3.判断下一点在哪个子区域内
                //      * 原子区域的validIndexRanges增加[startIndex,index]的部分
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
                    part.getChildPart(childpartType).validIndexRanges.push([
                        startIndex,
                        index,
                    ])
                    startIndex = index + 1
                    childpartType = part.nodeInWhichChildPart(nextNode)
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
            if (isNaN(k)) {
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
            if (
                part.farthestLine &&
                calDisInScreen(
                    part.farthestLine[0],
                    part.farthestLine[1],
                    part.farthestLine[2],
                    part.farthestLine[3],
                    camera
                ) < minViewDis
            ) {
                // res = res
            } else {
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
                    .reduce((prev, curr) => {
                        return prev.concat([curr.x, curr.z, curr.y])
                    }, [])
            }

            return res
        }
    }
}
