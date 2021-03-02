import { Vector2, Vector3 } from "three"

const VIEW_RECT = [-1, 1, -1, 1]
const VIEW_RECT_NODE = [
    { x: VIEW_RECT[0], y: VIEW_RECT[2] },
    { x: VIEW_RECT[0], y: VIEW_RECT[3] },
    { x: VIEW_RECT[1], y: VIEW_RECT[2] },
    { x: VIEW_RECT[1], y: VIEW_RECT[3] },
]
const VIEW_RECT_BOUND = [
    [VIEW_RECT_NODE[0], VIEW_RECT_NODE[1]],
    [VIEW_RECT_NODE[1], VIEW_RECT_NODE[3]],
    [VIEW_RECT_NODE[3], VIEW_RECT_NODE[2]],
    [VIEW_RECT_NODE[2], VIEW_RECT_NODE[0]],
]

// 获取地理坐标在屏幕中的投影
export function getCoordInScreen(x, y, camera) {
    return new Vector3(x, 0, y).project(camera)
}

// 获取线段长度
export function getVecLength(x1, y1, x2, y2) {
    return new Vector2(x1 - x2, y1 - y2).length()
}

// 获取线段在屏幕中投影长度
export function calDisInScreen(x1, y1, x2, y2, camera) {
    let pt1 = getCoordInScreen(x1, y1, camera)
    let pt2 = getCoordInScreen(x2, y2, camera)
    let vec = pt1.addScaledVector(pt2, -1)
    vec.z = 0
    return vec.length()
}

// 获取点到线段的垂足(线段为x1,y1,x2,y2，点为x3,y3)
export function getDropFoot(x1, y1, x2, y2, x3, y3) {
    let k = (y2 - y1) / (x2 - x1)
    if (isFinite(k)) {
        let x = (k * k * x1 + k * (y3 - y1) + x3) / (k * k + 1)
        let y = k * (x - x1) + y1
        return [x, y]
    } else {
        return [x1, y3]
    }
}

// 判断点是否在四边形内
function isNodeInQuad(pt, [pt1, pt2, pt3, pt4]) {
    let a = (pt2.x - pt1.x) * (pt.y - pt1.y) - (pt2.y - pt1.y) * (pt.x - pt1.x)
    let b = (pt3.x - pt2.x) * (pt.y - pt2.y) - (pt3.y - pt2.y) * (pt.x - pt2.x)
    let c = (pt4.x - pt3.x) * (pt.y - pt3.y) - (pt4.y - pt3.y) * (pt.x - pt3.x)
    let d = (pt1.x - pt4.x) * (pt.y - pt4.y) - (pt1.y - pt4.y) * (pt.x - pt4.x)
    return (
        (a > 0 && b > 0 && c > 0 && d > 0) || (a < 0 && b < 0 && c < 0 && d < 0)
    )
}

// 判断两个线段是否相交
function intersect(pt1, pt2, pt3, pt4) {
    // 快速排斥
    if (
        Math.max(pt1.x, pt2.x) < Math.min(pt3.x, pt4.x) ||
        Math.max(pt1.y, pt2.y) < Math.min(pt3.y, pt4.y) ||
        Math.max(pt3.x, pt4.x) < Math.min(pt1.x, pt2.x) ||
        Math.max(pt3.y, pt4.y) < Math.min(pt1.y, pt2.y)
    ) {
        return false
    }
    return !(
        ((pt1.x - pt3.x) * (pt4.y - pt3.y) -
            (pt1.y - pt3.y) * (pt4.x - pt3.x)) *
            ((pt2.x - pt3.x) * (pt4.y - pt3.y) -
                (pt2.y - pt3.y) * (pt4.x - pt3.x)) >
            0 ||
        ((pt3.x - pt1.x) * (pt2.y - pt1.y) -
            (pt3.y - pt1.y) * (pt2.x - pt1.x)) *
            ((pt4.x - pt1.x) * (pt2.y - pt1.y) -
                (pt4.y - pt1.y) * (pt2.x - pt1.x)) >
            0
    )
}

// 判断四边形是否和视口相交（相交的情况如下）
// 1.视口的四个点至少有一个在四边形内
// 2.视口的边与四边形的边存在相交
function intersectBound(bound) {
    return (
        isNodeInQuad(VIEW_RECT_NODE[0], bound) ||
        isNodeInQuad(VIEW_RECT_NODE[1], bound) ||
        isNodeInQuad(VIEW_RECT_NODE[2], bound) ||
        isNodeInQuad(VIEW_RECT_NODE[3], bound) ||
        VIEW_RECT_BOUND.some((edge) =>
            intersect(edge[0], edge[1], bound[0], bound[2])
        ) ||
        VIEW_RECT_BOUND.some((edge) =>
            intersect(edge[0], edge[1], bound[0], bound[3])
        ) ||
        VIEW_RECT_BOUND.some((edge) =>
            intersect(edge[0], edge[1], bound[1], bound[3])
        ) ||
        VIEW_RECT_BOUND.some((edge) =>
            intersect(edge[0], edge[1], bound[1], bound[2])
        )
    )
}

// 判断某个点是否处于视野外
function isNodeOutOfScreen(pt, camera) {
    return !(pt.x >= -1 && pt.x <= 1 && pt.y >= -1 && pt.y <= 1)
}

// 判断某个边界是否处于视野外
export function isSquareOutOfScreen(bound, camera) {
    let [x1, y1, x2, y2] = bound
    let pt1 = getCoordInScreen(x1, y1, camera)
    let pt2 = getCoordInScreen(x1, y2, camera)
    let pt3 = getCoordInScreen(x2, y2, camera)
    let pt4 = getCoordInScreen(x2, y1, camera)
    let res =
        isNodeOutOfScreen(pt1, camera) &&
        isNodeOutOfScreen(pt2, camera) &&
        isNodeOutOfScreen(pt3, camera) &&
        isNodeOutOfScreen(pt4, camera) &&
        !intersectBound([pt1, pt2, pt3, pt4])
    if (
        res &&
        bound[0] === -0.5 &&
        bound[1] === -0.5 &&
        bound[2] === 0.5 &&
        bound[3] === 0.5
    ) {
        // debugger
    }
    return res
}
