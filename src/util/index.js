import { Vector3 } from "three"
export const getCoordInScreen = (x, y, camera) => {
    return new Vector3(x, 0, y).project(camera)
}
export const calDisInScreen = (x1, y1, x2, y2, camera) => {
    let pt1 = getCoordInScreen(x1, y1, camera)
    let pt2 = getCoordInScreen(x2, y2, camera)
    let vec = pt1.addScaledVector(pt2, -1)
    vec.z = 0
    return vec.length()
}
