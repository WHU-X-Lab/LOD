import * as THREE from "three";
import {
  MIN_ATTACH_DISTANCE,
  MIN_SPLIT_DISTANCE,
  MIN_VIEW_DISTANCE,
  childPartTypes,
  MAX_LEVEL
} from "../config";
import {
  calDisInScreen,
  getDropFoot,
  getVecLength,
  isSquareOutOfScreen
} from "../util";

const MIN_LEVEL_WIDTH = 1 / Math.pow(2, MAX_LEVEL);

class Node {
  constructor(x = 0, y = 0, z = 0, uuid = 0) {
    Object.assign(this, { x, y, z, uuid });
  }
}

class Part {
  constructor(level = 0, bound = [-0.5, -0.5, 0.5, 0.5]) {
    this.level = level;
    this.bound = bound;
    this.nodes = [];
    this.childParts = {
      tl: null,
      tr: null,
      bl: null,
      br: null
    };
    this.farthestLine = null;
  }
  addNode(node) {
    if (this.level > MAX_LEVEL) return;
    if (this.isNodeBelongPart(node) || node.special) {
      this.nodes.push(node);
    }
    let childParts = this.addChildPart(node);
    childParts.map(childPart => {
      childPart.addNode(node);
    });
  }
  isNodeBelongPart(node) {
    return (
      node.x === this.bound[0] ||
      node.x === this.bound[2] ||
      node.y === this.bound[1] ||
      node.y === this.bound[3]
    );
  }
  addChildPart(node) {
    const midX = (this.bound[0] + this.bound[2]) / 2;
    const midY = (this.bound[1] + this.bound[3]) / 2;
    let childParts = [];
    if (
      node.x <= midX + MIN_ATTACH_DISTANCE &&
      node.y <= midY + MIN_ATTACH_DISTANCE
    ) {
      childParts.push(
        this.childParts["bl"] ||
          this.createChildPart("bl", [this.bound[0], this.bound[1], midX, midY])
      );
    }
    if (
      node.x <= midX + MIN_ATTACH_DISTANCE &&
      node.y > midY - MIN_ATTACH_DISTANCE
    ) {
      childParts.push(
        this.childParts["tl"] ||
          this.createChildPart("tl", [this.bound[0], midY, midX, this.bound[3]])
      );
    }
    if (
      node.x >= midX - MIN_ATTACH_DISTANCE &&
      node.y <= midY + MIN_ATTACH_DISTANCE
    ) {
      childParts.push(
        this.childParts["br"] ||
          this.createChildPart("br", [midX, this.bound[1], this.bound[2], midY])
      );
    }
    if (
      node.x >= midX - MIN_ATTACH_DISTANCE &&
      node.y > midY - MIN_ATTACH_DISTANCE
    ) {
      childParts.push(
        this.childParts["tr"] ||
          this.createChildPart("tr", [midX, midY, this.bound[2], this.bound[3]])
      );
    }
    return childParts;
  }
  createChildPart(childPartType, bound) {
    if (!childPartTypes.includes(childPartType)) {
      throw new Error("Wrong childpart type");
    }
    return (this.childParts[childPartType] = new Part(this.level + 1, bound));
  }
  traverse(drawCb, drawHintCb, camera) {
    return traverseSub.call(this);
    function traverseSub() {
      let res = this.nodes;
      // 如果整个边界都处于视野外，则没有必要计算和渲染
      if (isSquareOutOfScreen(this.bound, camera)) {
        console.log("节省效率");
        return res;
      }
      drawCb(this.bound);
      // 1.如果最大垂距的投影小于阈值，说明该区域可被线段替代
      // 2.如果最大垂距的投影大于阈值，说明该区域还不能被线段替代，需要往下剖分
      // 3.如果不存在可替代线段，直接返回该层的点即可
      let dis = calDisInScreen(
        this.farthestLine[0],
        this.farthestLine[1],
        this.farthestLine[2],
        this.farthestLine[3],
        camera
      );
      if (
        this.farthestLine &&
        calDisInScreen(
          this.farthestLine[0],
          this.farthestLine[1],
          this.farthestLine[2],
          this.farthestLine[3],
          camera
        ) > MIN_SPLIT_DISTANCE
      ) {
        childPartTypes.map(type => {
          this.childParts[type] &&
            (res = res.concat(traverseSub.call(this.childParts[type])));
        });
      } else {
        if (this.farthestLine.length) {
          drawHintCb(...this.farthestLine);
        }
      }
      if (this.level === 0) {
        res = res
          .sort((a, b) => a.uuid - b.uuid)
          .reduce((prev, curr) => {
            return prev.concat([curr.x, curr.z, curr.y]);
          }, []);
      }
      return res;
    }
  }
}

export class QuadTree {
  constructor(points) {
    this.root = new Part(0);
    this.uuid = 0;
    this.points = points;
    this.findInterfactNodes(0);
    for (let i = 0; i < this.points.length; i += 3) {
      this.addNode(
        new Node(
          this.points[i],
          this.points[i + 1],
          this.points[i + 2],
          this.uuid++
        )
      );
    }
    this.findFarNode(this.root);
  }
  // 找到指定层级的交点
  findInterfactNodes(level) {
    if (level > MAX_LEVEL) return [];
    const dis = 1 / Math.pow(2, level);
  }
  addNode(node) {
    this.root.addNode(node);
  }
  // 遍历根结点，找到每一层最远的点对，并存储下来
  findFarNode(part) {
    part.nodes = part.nodes.sort((a, b) => a.uuid - b.uuid);
    // 如果仅存在一个有效点，则直接返回空，表示该区域内无任何点
    if (part.nodes.length <= 1) {
      return (part.farthestLine = []);
    }
    // 如果存在不止两个有效点，则基于阈值找出连续区间，并且找到各个区间内的最远垂距，取最大的一个作为整个区间的可代替点对
    // 并且需要递归下去
    if (part.nodes.length > 1) {
      let allNodes = childPartTypes.reduce((nodes, type) => {
        if (part.childParts[type]) {
          return nodes.concat(this.findFarNode(part.childParts[type]));
        } else {
          return nodes;
        }
      }, part.nodes);
      // 对该区域内全部的点进行去重和排序
      let uuidSet = new Set();
      allNodes = allNodes.reduce((prev, curr) => {
        if (uuidSet.has(curr.uuid)) {
          return prev;
        } else {
          uuidSet.add(curr.uuid);
          prev.push(curr);
          return prev;
        }
      }, []);
      allNodes = allNodes.sort((a, b) => a.uuid - b.uuid);
      if (
        part.bound[0] === -0.5 &&
        part.bound[1] === 0 &&
        part.bound[2] === 0 &&
        part.bound[3] === 0.5
      ) {
        debugger;
      }
      let maxDis = -Infinity;
      let maxDisNodes = [];
      let nodeIndex1 = 0;
      let nodeIndex2 = 1;
      let node1, node2, node2Before;
      while (nodeIndex2 < allNodes.length) {
        node1 = allNodes[nodeIndex1];
        node2 = allNodes[nodeIndex2];
        node2Before = allNodes[nodeIndex2 - 1];
        if (
          getVecLength(node2Before.x, node2Before.y, node2.x, node2.y) >
          MIN_VIEW_DISTANCE
        ) {
          for (let i = nodeIndex1; i < nodeIndex2; i++) {
            let node = allNodes[i];
            let dropFoot = getDropFoot(
              node1.x,
              node1.y,
              node2Before.x,
              node2Before.y,
              node.x,
              node.y
            );
            let dis = getVecLength(dropFoot[0], dropFoot[1], node.x, node.y);
            if (dis > maxDis) {
              maxDis = dis;
              maxDisNodes = [dropFoot[0], dropFoot[1], node.x, node.y];
            }
            nodeIndex1 = nodeIndex2;
          }
        }
        nodeIndex2++;
      }
      part.farthestLine = maxDisNodes;
      return allNodes;
    }
  }
  traveseTree(...args) {
    return this.root.traverse(...args);
  }
}
