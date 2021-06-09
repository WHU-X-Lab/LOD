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
    composeNodes,
} from "../util"

import Node from "./node"
import Part from "./part"
import Queue from "./queue"

// 判断当前格网是否需要分裂
function needSplit(part, minViewDis, camera, transfer) {
    const { farthestLine } = part
    if (!farthestLine) return false
    let pt1 = transfer({ x: farthestLine[0], y: farthestLine[1] })
    let pt2 = transfer({ x: farthestLine[2], y: farthestLine[3] })
    return calDisInScreen(pt1.x, pt1.y, pt2.x, pt2.y, camera) > minViewDis
}

// 判断当前格网是否需要分裂（缓存版）
function cachedNeedSplit(cache, part, minViewDis, camera) {
    const cacheKey = JSON.stringify(part.bound) + String(minViewDis)
    if (cache[cacheKey]) {
        return cache[cacheKey]
    }
    return (cache[cacheKey] = needSplit(part, minViewDis, camera))
}

// 定义四叉树类
export default class Quadtree {
    constructor(nodesBuffer = []) {
        this._rootPart = new Part(0)
        this._uuid = 0
        this._nodes = []
        this.unsplittedNodesQueue = new Queue()
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
    // 遍历一个格网内的全部节点
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

    // 1.找到原始曲线与全部层级的交点
    // 2.找到每一层最远的点对，并且存储为当前格网的farthestLine
    //   注意：一个格网内可能曲线会分为不连续的多段，这个时候farthestLine取多段中最远的即可
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
        // traverseValidNodes方法是用来处理同一个区域内曲线不连续的情况
        this.traverseValidNodes(
            part.includingNodes,
            ({ node, index, nodeList, nextNode }) => {
                if (index === 0) startIndex = 0
                // 如果是当前点是最后的点，则直接进行子区域判断
                if (!nextNode) {
                    endNode = null
                    part.getChildPart(childpartType).includingNodes.push(
                        composeNodes(
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
                //      * 原来子区域的includingNodes增加[startIndex,index]的部分
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
                        composeNodes(
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
    // 求出node和nextNode连线和当前格网的交点
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
    // 遍历整个四叉树
    traverse(drawCb, transfer, camera, minViewDis) {
        return sub.call(this, this._rootPart)
        function sub(part) {
            // 如果整个边界都处于视野外，则没有必要计算和渲染<视域剔除>
            if (isSquareOutOfScreen(part.bound, camera)) {
                // this.unsplittedNodesQueue.enqueue(part)
                return []
            }
            drawCb(part.bound)

            let res = part.intersectNodes
            if (needSplit(part, minViewDis, camera, transfer)) {
                childPartTypes.map((type) => {
                    part.childParts[type] &&
                        (res = res.concat(
                            sub.call(this, part.childParts[type])
                        ))
                })
            } else {
                // this.unsplittedNodesQueue.enqueue(part)
            }

            /**
             * 遍历的结果需要合并，合并在level为0也就是最大的格网里，并且输出
             * 1.concat是为了将曲线的首尾两个端点和遍历的结果合在一起
             * 2.sort是为了让最终输出的结果还是按照原始曲线的形式进行排序
             * 3.reduce是为了将排序后的点对组织成buffer的形式，方便threejs里赋值。
             *   不理解这一步的话可以在控制台里查看没有reduce和reduce之后结果对比
             */

            if (part.level === 0) {
                res = res
                    .concat([
                        this._nodes[0],
                        this._nodes[this._nodes.length - 1],
                    ])
                    .sort((a, b) => a.uuid - b.uuid)
                    .reduce((prev, curr) => {
                        curr = transfer(curr)
                        return prev.concat([curr.x, 0, curr.y])
                    }, [])
            }

            return res
        }
    }
    // 视角变化时动态调整
    dynamicModify(drawCb, camera, minViewDis) {
        // 初始化删除Cache
        const _deleteCache = {}
        // 获取未分裂的节点
        let { unsplittedNodesQueue } = this
        let unsplittedNodesQueueBackup = new Queue()
        let _splitCache = {}
        if (unsplittedNodesQueue.isEmpty()) {
            unsplittedNodesQueue.enqueue(this._rootPart)
        }
        while (!unsplittedNodesQueue.isEmpty()) {
            let { data: currentNode } = unsplittedNodesQueue.dequeue()
            let { bound, parent: parentNode } = currentNode
            /* 如果当前节点的格网被判断是需要删除，则直接进行下一次循环 */
            if (this.shouldDelete(_deleteCache, currentNode)) {
                return
            }
            /* 如果当前节点（格网）在视野外，则取消该格网的绘制，并进行下一次循环 */
            if (isSquareOutOfScreen(bound, camera)) {
                unsplittedNodesQueueBackup.enqueue(currentNode)
                drawCb(bound, true)
                return
            }
            drawCb(bound)
            /**
             * 1.如果需要分裂，则将当前节点的子节点全部入队
             * 2.如果不需要分裂，则判断其父节点分裂与否
             *   - 如果分裂，则当前格网入队并且绘制
             *   - 如果不分裂，则父节点的全部子节点取消绘制，并且对父节点也做步骤2的判断(这里采取的做法是首先取消当前格网的绘制，然后将父节点入队)
             */
            if (cachedNeedSplit(_splitCache, currentNode, minViewDis, camera)) {
                childPartTypes.map((childpartType) => {
                    currentNode.childParts[childpartType] &&
                        unsplittedNodesQueue.enqueue(
                            currentNode.childParts[childpartType]
                        )
                })
            } else {
                if (
                    !parentNode ||
                    cachedNeedSplit(_splitCache, parentNode, minViewDis, camera)
                ) {
                    unsplittedNodesQueueBackup.enqueue(currentNode)
                } else {
                    this.deleteAllSubNode(parentNode, _deleteCache, drawCb)
                    unsplittedNodesQueue.enqueue(parentNode)
                }
            }
        }
        this.unsplittedNodesQueue = unsplittedNodesQueueBackup
        unsplittedNodesQueueBackup = null
    }
    // 判断某个节点的格网是否需要被删除
    shouldDelete(deleteCache, node) {
        const nodeKey = JSON.stringify(node.bound)
        return deleteCache[nodeKey]
    }
    // 删除掉指定节点的全部子节点的格网
    deleteAllSubNode(node, deleteCache, drawCb) {
        const { bound, childParts } = node
        let childpart = null
        childPartTypes.map((childpartType) => {
            if ((childpart = childParts[childpartType])) {
                // 删除该子格网,并计入缓存
                const nodeKey = JSON.stringify(childpart.bound)
                deleteCache[nodeKey] = true
                drawCb(bound, true)
                // 对该子格网递归调用本方法
                this.deleteAllSubNode(childpart, deleteCache, drawCb)
            }
        })
    }
}
