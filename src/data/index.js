let data = require("./river.json")
let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]

const setData = (d) => (data = d)

const parseData = () =>
    new Promise((resolve) => {
        let result = []
        if (data.hasOwnProperty("features")) {
            /* GeoJSON To JSON */
            data.features.map((feature, index) => {
                if (index === 10) {
                    let res = []
                    feature.geometry.coordinates.map((coord) => {
                        if (coord[0] < minX) minX = coord[0]
                        if (coord[0] > maxX) maxX = coord[0]
                        if (coord[1] < minY) minY = coord[1]
                        if (coord[1] > maxY) maxY = coord[1]
                        res.push(coord)
                    })
                    result.push(res)
                }
            })
            resolve(result)
        } else {
            /* Img To Array */
            let url = data.files[0]
            let img = document.createElement("img")
            img.src = window.URL.createObjectURL(url)
            let canvas = document.createElement("canvas")
            let ctx = canvas.getContext("2d")

            img.onload = ({ target }) => {
                let { width, height } = target
                canvas.width = width
                canvas.height = height
                ctx.drawImage(target, 0, 0)
                let { data } = ctx.getImageData(0, 0, width, height)
                minX = 0
                minY = 0
                maxX = width
                maxY = height
                for (let i = 0; i < data.length; i += 4) {
                    let x = (i / 4) % width
                    let y = Math.floor(i / 4 / width)
                    let z = (10 * data[i]) / 255
                    result.push([x, y, z])
                }
                resolve(result)
            }
        }
    })

const getData = (d = null) => {
    if (d !== null) setData(d)
    return new Promise((resolve) => {
        parseData().then((data) => {
            resolve({
                data,
                minX,
                minY,
                maxX,
                maxY,
            })
        })
    })
}

export { getData }
