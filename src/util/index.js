import { Vector2, Vector3 } from "three"

// 获取地理坐标在屏幕中的投影
export const getCoordInScreen = (x, y, camera) => {
    return new Vector3(x, 0, y).project(camera)
}

// 获取线段长度
export const getVecLength = (x1, y1, x2, y2) => {
    return new Vector2(x1 - x2, y1 - y2).length()
}

// 获取线段在屏幕中投影长度
export const calDisInScreen = (x1, y1, x2, y2, camera) => {
    let pt1 = getCoordInScreen(x1, y1, camera)
    let pt2 = getCoordInScreen(x2, y2, camera)
    let vec = pt1.addScaledVector(pt2, -1)
    vec.z = 0
    return vec.length()
}

// 获取点到线段的垂足(线段为x1,y1,x2,y2，点为x3,y3)
export const getDropFoot = (x1, y1, x2, y2, x3, y3) => {
    let k = (y2 - y1) / (x2 - x1)
    if (isFinite(k)) {
        let x = (k * k * x1 + k * (y3 - y1) + x3) / (k * k + 1)
        let y = k * (x - x1) + y1
        return [x, y]
    } else {
        return [x1, y3]
    }
}
