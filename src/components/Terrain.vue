<template>
  <div class="terrain-wrap">
    <div class="tip">当前LOD层级{{ segments }}</div>
    <div class="axis axis-left" v-show="showAxis"></div>
    <div class="axis axis-right" v-show="showAxis"></div>
    <canvas
      class="terrain"
      @click="onViewChange"
      @contextmenu="onViewChange"
      @wheel="onViewChange"
    ></canvas>
  </div>
</template>

<script>
import * as THREE from "three";
import { mapState } from "vuex";
import { MapControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getData } from "../data";
import { QuadTree } from "../view/quadtree";

export default {
  data() {
    return {
      cameraDepth: 1.2,
      clearColor: "#fff",
      terrainScale: 100, // Actual width
      scene: null,
      canvas: null,
      camera: null,
      renderer: null,
      controls: null,
      frameGroup: null,
      geom: null,
      mat: null,
      mesh: null,
      arrayedLine: null
    };
  },
  mounted() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      this.terrainScale
    );
    this.camera.position.set(0, 2, 0);
    this.resetRenderer();
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePanning = false;

    // <DEBUG> wireframe
    this.resetGroup();

    // <Main>
    this.material = new THREE.LineBasicMaterial({
      color: 0x0000ff
    });
    this.geom = new THREE.BufferGeometry();

    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });

    // init
    getData().then(this.init, err => {
      throw err;
    });
  },
  watch: {
    segments(rank) {
      this.updateGeomByRank(rank);
    },
    showFrame(show) {
      if (show) {
        this.scene.add(this.frameGroup);
      } else {
        this.scene.remove(this.frameGroup);
      }
    }
  },
  computed: {
    ...mapState(["segments", "showFrame", "showAxis"])
  },
  methods: {
    onViewChange() {
      this.updateGeomByRank(this.segments);
    },
    init({ data, minX, minY, maxX, maxY }) {
      let points = [];
      let direction = new THREE.Vector3();
      data.map(coord => {
        let mappedCoord = this.mapCoordType(coord, {
          minX,
          minY,
          maxX,
          maxY
        });
        direction.x = mappedCoord[0];
        direction.y = mappedCoord[1];
        direction.z = 0;
        points.push(direction.x, direction.y, direction.z);
      });
      this.rankedLine = new QuadTree(points);
      this.updateGeomByRank(this.segments);
    },
    resetRenderer() {
      let canvas = document.getElementsByClassName("terrain")[0];
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true
      });
      this.renderer.setClearColor(this.clearColor);
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    resetGroup() {
      this.scene.remove(this.frameGroup);
      this.frameGroup = new THREE.Group();
      this.scene.add(this.frameGroup);
    },
    drawBound(bound) {
      let boundBuffer = [
        bound[0],
        0,
        bound[1],
        bound[0],
        0,
        bound[3],
        bound[2],
        0,
        bound[3],
        bound[2],
        0,
        bound[1],
        bound[0],
        0,
        bound[1]
      ];
      let geom = new THREE.BufferGeometry();
      let mat = new THREE.LineBasicMaterial({ color: 0x000000 });
      geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(boundBuffer, 3)
      );
      let mesh = new THREE.Line(geom, mat);
      this.frameGroup.add(mesh);
    },
    mapCoordType(coord, { minX, minY, maxX, maxY }) {
      return [
        (coord[0] - minX) / (maxX - minX) - 0.5,
        1 - (coord[1] - minY) / (maxY - minY) - 0.5
      ];
    },
    updateGeomByRank(rank) {
      console.log(this.camera.position)
      this.resetGroup();
      let points = null;
      if (this.showFrame) {
        points = this.rankedLine.traveseTreeByLevel(
          rank,
          this.drawBound,
          this.camera.position
        );
      } else {
        points = this.rankedLine.traveseTreeByLevel(
          rank,
          () => {},
          this.camera.position
        );
      }

      this.geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(points, 3)
      );
      if (!this.mesh) {
        this.mesh = new THREE.Line(this.geom, this.material);
        this.scene.add(this.mesh);
      }
    }
  }
};
</script>

<style lang="less" scoped>
.terrain-wrap {
  position: relative;
  .axis {
    position: absolute;
    margin-left: 50vw;
    margin-top: 50vh;
    width: 50px;
    height: 50px;
    pointer-events: none;
  }
  .axis-left {
    border-left: 5px solid red;
    transform: translate(-2.5px, -25px);
  }
  .axis-right {
    border-top: 5px solid red;
    transform: translate(-25px, -2.5px);
  }
  .tip {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
  .terrain {
    width: 100%;
    height: 100%;
  }
}
</style>
