<template>
  <div class="terrain-wrap">
    <div class="axis axis-left" v-show="showAxis"></div>
    <div class="axis axis-right" v-show="showAxis"></div>
    <canvas
      class="terrain"
      @mouseup="onViewChange"
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
import { MAX_LEVEL } from "../config";

const MIN_LEVEL_WIDTH = 1 / Math.pow(2, MAX_LEVEL);

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
      hintGroup: null,
      geom: null,
      mat: null,
      mesh: null,
      arrayedLine: null,
    };
  },
  mounted() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      this.terrainScale
    );
    this.camera.lookAt({ x: 0, y: 0, z: 0 });
    this.camera.position.set(0, 2, 0);
    this.resetRenderer();
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePanning = false;

    // <DEBUG> wireframe
    this.resetGroup();

    // <Main>
    this.material = new THREE.LineBasicMaterial({
      color: 0x0000ff,
    });
    this.oriMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
    });
    this.geom = new THREE.BufferGeometry();
    this.oriGeom = new THREE.BufferGeometry();

    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });

    // init
    getData().then(this.init, (err) => {
      throw err;
    });
  },
  watch: {
    showOriData(show) {
      if (show) {
        this.scene.add(this.oriMesh);
      } else {
        this.scene.remove(this.oriMesh);
      }
    },
    showFrame(show) {
      if (show) {
        this.scene.add(this.frameGroup);
      } else {
        this.scene.remove(this.frameGroup);
      }
    },
  },
  computed: {
    ...mapState(["showFrame", "showAxis", "showOriData"]),
  },
  methods: {
    onViewChange() {
      this.updateGeom();
    },
    init({ data, minX, minY, maxX, maxY }) {
      let points = [];
      let firstPt = this.mapCoordType(data[0], { minX, minY, maxX, maxY });
      let oriPoints = [firstPt[0], 0, firstPt[1]];
      for (let i = 1; i < data.length; i++) {
        const coord1 = this.mapCoordType(data[i - 1], {
          minX,
          minY,
          maxX,
          maxY,
        });
        const coord2 = this.mapCoordType(data[i], { minX, minY, maxX, maxY });
        const a = (coord1[1] - coord2[1]) / (coord1[0] - coord2[0]);
        const b = coord1[1] - a * coord1[0];
        let childNodes = [coord1[0], coord2[0]];
        oriPoints.push(coord1[0], 0, coord1[1]);
        if (coord1[0] - coord2[0] !== 0) {
          if (coord1[0] <= coord2[0]) {
            for (let i = coord1[0]; i <= coord2[0]; i += MIN_LEVEL_WIDTH) {
              childNodes.push(i - (i % MIN_LEVEL_WIDTH));
            }
          } else {
            for (let i = coord2[0]; i <= coord1[0]; i += MIN_LEVEL_WIDTH)
              childNodes.push(i - (i % MIN_LEVEL_WIDTH));
          }
        }
        if (a !== 0) {
          if (coord1[1] <= coord2[1]) {
            for (let i = coord1[1]; i <= coord2[1]; i += MIN_LEVEL_WIDTH) {
              childNodes.push((i - b) / a - (((i - b) / a) % MIN_LEVEL_WIDTH));
            }
          } else {
            for (let i = coord2[1]; i <= coord1[1]; i += MIN_LEVEL_WIDTH)
              childNodes.push((i - b) / a - (((i - b) / a) % MIN_LEVEL_WIDTH));
          }
        }

        childNodes.sort((a, b) => a - b);
        childNodes = [...new Set(childNodes)];
        childNodes.map((x) => {
          points.push(x, a * x + b, 0);
        });
      }
      this.oriGeom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(oriPoints, 3)
      );
      this.oriMesh = new THREE.Line(this.oriGeom, this.oriMaterial);
      this.rankedLine = new QuadTree(points);
      this.updateGeom();
    },
    resetRenderer() {
      let canvas = document.getElementsByClassName("terrain")[0];
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
      });
      this.renderer.setClearColor(this.clearColor);
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    resetGroup() {
      // 正方形框架的Group Reset
      this.scene.remove(this.frameGroup);
      this.frameGroup = new THREE.Group();
      this.scene.add(this.frameGroup);
      // 提示线/文字的Group Reset
      this.scene.remove(this.hintGroup);
      this.hintGroup = new THREE.Group();
      this.scene.add(this.hintGroup);
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
        bound[1],
      ];
      let geom = new THREE.BufferGeometry();
      let mat = new THREE.LineBasicMaterial({ color: 0x000000 }); // Black
      geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(boundBuffer, 3)
      );
      let mesh = new THREE.Line(geom, mat);
      this.frameGroup.add(mesh);
    },
    drawHint(x1, y1, x2, y2) {
      let hintBuffer = [x1, 0, y1, x2, 0, y2];
      let geom = new THREE.BufferGeometry();
      let mat = new THREE.LineBasicMaterial({ color: 0x8e44ad }); // Green
      geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(hintBuffer, 3)
      );
      let mesh = new THREE.Line(geom, mat);
      this.frameGroup.add(mesh);
    },
    mapCoordType(coord, { minX, minY, maxX, maxY }) {
      return [
        (coord[0] - minX) / (maxX - minX) - 0.5,
        1 - (coord[1] - minY) / (maxY - minY) - 0.5,
      ];
    },
    updateGeom() {
      this.resetGroup();
      let points = null;
      if (this.showFrame) {
        points = this.rankedLine.traveseTree(
          this.drawBound,
          this.drawHint,
          this.camera
        );
      } else {
        points = this.rankedLine.traveseTree(
          () => {},
          this.drawHint,
          this.camera
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
    },
  },
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
