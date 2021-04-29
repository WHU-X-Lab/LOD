let fs = require("fs")
let path = require("path")
let join = require("path").join
const data = require("./hyd1_4p (1).json")

const minX = 180138
const minY = 211288
const maxX = 186560
const maxY = 216104

let minx = Infinity,
    miny = Infinity,
    maxx = -Infinity,
    maxy = -Infinity

const json = { geometries: [] }

data.geometries.map((geom) => {
    const allData = geom.coordinates[0]
    const len = allData.length
    const childLen = len / 10
    let currData = [],
        currIndex = 0

    for (let i = 0; i < len; i++) {
        if (allData[i][0] < minx) minx = allData[i][0]
        if (allData[i][0] > maxx) maxx = allData[i][0]
        if (allData[i][1] < miny) miny = allData[i][1]
        if (allData[i][1] > maxy) maxy = allData[i][1]
        if (currIndex > childLen || i === len - 1) {
            if (i === len - 1) {
                currData.push(allData[0])
            } else {
                currData.push(allData[i])
            }
            json.geometries.push({
                type: "Polygon",
                coordinates: currData,
            })
            currData = [allData[i]]
            currIndex = 0
        } else {
            currIndex++
            currData.push(allData[i])
        }
    }
})

let scale = 0.4 / Math.max(maxx - minx, maxy - miny)

json.geometries.map((geom) => {
    let data = geom.coordinates
    for (let i = 0; i < data.length; i++) {
        let coord = data[i]
        let x = (coord[0] - minx) * scale - 0.3
        let y = (coord[1] - miny) * scale - 0.5
        geom.coordinates[i] = [x, y]
    }
})

fs.writeFileSync("../src/data/hupo2.json", JSON.stringify(json))
