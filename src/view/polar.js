function des2polar({ x, y }) {
    let r = Math.sqrt(x * x + y * y)
    let fi = null
    if (x === 0 && y === 0) {
        fi = 0
    } else if (x >= 0 && y >= 0) {
        fi = Math.atan(y / x)
    } else if (x >= 0 && y <= 0) {
        fi = -Math.atan(-y / x)
    } else if (x <= 0 && y >= 0) {
        fi = Math.PI - Math.atan(-y / x)
    } else if (x <= 0 && y <= 0) {
        fi = Math.PI + Math.atan(y / x)
    }
    return { r, fi }
}
function polar2des({ r, fi }) {
    let x = r * Math.cos(fi)
    let y = r * Math.sin(fi)
    return { x, y }
}
function getNewR(r, { ss, sl, r0, r1 }) {
    if (r <= r0) {
        return r
    } else if (r <= r1) {
        return (
            r0 +
            ((0.5 * r * r * (ss - sl)) / (r1 - r0) +
                r * (sl - (r0 * (ss - sl)) / (r1 - r0)) -
                0.5 * ((r0 * r0 * (ss - sl)) / (r1 - r0)) -
                r0 * (sl - (r0 * (ss - sl)) / (r1 - r0))) /
                sl
        )
    } else {
        return r1 + ((r1 - r0) * (ss - sl)) / (2 * sl) + (ss * (r - r1)) / sl
    }
}

export default function transCoord(node, { ss, sl, r0, r1, centerX, centerY }) {
    let { r, fi } = des2polar({ x: node.x - centerX, y: node.y - centerY })
    let rnew = getNewR(r, { ss, sl, r0, r1 })
    let { x, y } = polar2des({ r: rnew, fi })
    return { x: x + centerX, y: y + centerY }
}
