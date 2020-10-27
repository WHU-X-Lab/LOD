import { Vector3 } from "three"
export const calDisByCamera = (x1, y1, x2, y2, camera) => {
    let pt1 = new Vector3(x1, 0, y1).project(camera)
    let pt2 = new Vector3(x2, 0, y2).project(camera)
    let vec = pt1.addScaledVector(pt2, -1)
    vec.z = 0
    return vec.length()
}
