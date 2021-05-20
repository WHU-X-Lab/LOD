import * as THREE from "three"

export default {
    mat: {
        grid: new THREE.LineBasicMaterial({ color: 0x000000 }),
        point: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        line: new THREE.MeshBasicMaterial({
            color: 0x0000ff,
        }),
        oriLine: new THREE.LineBasicMaterial({
            color: 0xff0000,
        }),
    },
    geom: {
        point: new THREE.SphereBufferGeometry(0.005, 32, 32),
    },
}
