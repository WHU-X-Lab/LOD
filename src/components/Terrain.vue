<template>
  <div class="terrain-wrap">
    <canvas class="terrain"></canvas>
  </div>
</template>

<script>
import * as THREE from "three";
import { mapState, mapMutations } from "vuex";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getData } from "../data";
import { QuadTree } from "../view";

export default {
  data() {
    return {
      useWireFrame: false,
      cameraDepth: 60,
      clearColor: "#fff",
      terrainScale: 100, // Actual width
      scene: null,
      canvas: null,
      camera: null,
      renderer: null,
      controls: null,
      geom: null,
      mat: null,
      mesh: null
    };
  },
  mounted() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      this.terrainScale * 10
    );
    this.camera.position.y = -this.cameraDepth;
    this.camera.position.z = this.cameraDepth;
    this.canvas = document.getElementsByClassName("terrain")[0];
    let { canvas } = this;
    this.renderer = new THREE.WebGLRenderer({
      canvas
    });
    this.renderer.setClearColor(this.clearColor);
    const pxRatio = Math.max(Math.floor(window.devicePixelRatio) || 1, 2);
    this.canvas.width = this.canvas.clientWidth / pxRatio;
    this.canvas.height = this.canvas.clientHeight / pxRatio;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.material = new THREE.MeshNormalMaterial({
      wireframe: this.useWireFrame,
      side: THREE.DoubleSide
    });

    this.updateGeometry();
    this.controls.update();
    this.animate();

    getData().then(this.initData, err => {
      throw err;
    });
  },
  watch: {
    useWireframe(use) {
      this.mesh.material.wireframe = use;
    },
    segments() {
      // this.handleAttrChange();
    },
    heightPerScale() {
      this.handleAttrChange();
    },
    geoData() {
      this.handleAttrChange();
    }
  },
  computed: {
    ...mapState(["useWireframe", "segments", "heightPerScale", "geoData"])
  },
  methods: {
    ...mapMutations(["setGeoData"]),
    handleAttrChange() {
      this.updateGeometry();
      this.mapData();
    },
    updateGeometry() {
      const [widthSegments, heightSegments] = [this.segments, this.segments];
      const [terrainWidth, terrainHeight] = [
        this.terrainScale,
        this.terrainScale
      ];
      this.geom = new THREE.PlaneBufferGeometry(
        terrainWidth,
        terrainHeight,
        widthSegments,
        heightSegments
      );
    },
    initData({ data, minX, minY, maxX, maxY }) {
      let { segments } = this;
      let vertices = this.geom.attributes.position.array;
      let width = segments + 1;
      let nodes = [];
      data.map(coord => {
        let mappedCoord = this.mapCoordType(coord, {
          minX,
          minY,
          maxX,
          maxY
        });
        let height = coord[2] ? coord[2] : 1;

        let index =
          Math.floor(mappedCoord[0] * width) +
          width * (Math.floor(width * mappedCoord[1]) - 1);

        nodes.push(this.heightPerScale * this.terrainScale * height);
      });
      this.quadtree = new QuadTree(nodes);
      this.mapData();
    },
    mapData() {
      let { data, minX, minY, maxX, maxY } = this.geoData;
      let { segments } = this;
      let vertices = this.geom.attributes.position.array;
      let scaleLength = segments + 1;
      data.map(coord => {
        let mappedCoord = this.mapCoordType(coord, {
          minX,
          minY,
          maxX,
          maxY
        });
        let height = coord[2] ? coord[2] : 1;

        let index =
          Math.floor(mappedCoord[0] * scaleLength) +
          scaleLength * (Math.floor(scaleLength * mappedCoord[1]) - 1);

        vertices[3 * index + 2] =
          this.heightPerScale * this.terrainScale * height;
      });

      this.geom.computeVertexNormals();
      this.scene.remove(this.mesh);
      this.mesh = new THREE.Mesh(this.geom, this.material);
      this.scene.add(this.mesh);
    },
    mapCoordType(coord, { minX, minY, maxX, maxY }) {
      return [
        (coord[0] - minX) / (maxX - minX),
        1 - (coord[1] - minY) / (maxY - minY)
      ];
    },
    animate() {
      requestAnimationFrame(this.animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }
};
</script>

<style lang="less" scoped>
.terrain-wrap {
  .terrain {
    width: 100%;
    height: 100%;
  }
}
</style>
