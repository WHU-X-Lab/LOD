const data = require("./data2.json")
let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]

export default function getData() {
    const result = []
    // 遍历数据，找到最大最小值
    data.geometries.map((feature) => {
        feature.coordinates.map((coord) => {
            if (coord[0] < minX) minX = coord[0]
            if (coord[0] > maxX) maxX = coord[0]
            if (coord[1] < minY) minY = coord[1]
            if (coord[1] > maxY) maxY = coord[1]
        })
    })
    const scale = 0.8 / Math.max(maxX - minX, maxY - minY)
    data.geometries.map((feature) => {
        let res = []
        feature.coordinates.map((coord) => {
            let x = (coord[0] - minX) * scale - 0.4
            let y = (coord[1] - minY) * scale - 0.2
            res.push([x, y])
        })
        result.push(res)
    })
    return Promise.resolve(result)
}
