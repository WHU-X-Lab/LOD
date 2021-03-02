<template>
  <div class="terrain-wrap" id="terrain-wrap">
    <canvas id="terrain" @mouseup="onViewChange" @wheel="onViewChange"></canvas>
    <div class="terrain-stats">
      <div class="terrain-stats-item">
        <div class="terrain-stats-item-title">FPS</div>
        <div class="terrian-stats-item-chart" id="fpsDom"></div>
      </div>
      <div class="terrain-stats-item">
        <div class="terrain-stats-item-title">每帧耗时</div>
        <div class="terrian-stats-item-chart" id="msDom"></div>
      </div>
      <div class="terrain-stats-item">
        <div class="terrain-stats-item-title">内存</div>
        <div class="terrian-stats-item-chart" id="mbDom"></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as THREE from "three";
import { mapState } from "vuex";
import { MapControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "stats.js";
import { getData } from "../data";
import { QuadTree } from "../view";

export default {
  props: {
    eventHandler: {
      type: Object,
      default: () => {},
    },
  },
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
      ptGroup: null,
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

    this.ptGroup = new THREE.Group();

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

    // init stats
    const stats1 = new Stats();
    stats1.dom.style.position = "";
    stats1.dom.style.top = "";
    stats1.dom.style.bottom = "";
    const stats2 = new Stats();
    stats2.dom.style.position = "";
    stats2.dom.style.top = "";
    stats2.dom.style.bottom = "";
    const stats3 = new Stats();
    stats3.dom.style.position = "";
    stats3.dom.style.top = "";
    stats3.dom.style.bottom = "";
    stats1.showPanel(0);
    document.getElementById("fpsDom").appendChild(stats1.dom);
    stats2.showPanel(1);
    document.getElementById("msDom").appendChild(stats2.dom);
    stats3.showPanel(2);
    document.getElementById("mbDom").appendChild(stats3.dom);

    this.renderer.setAnimationLoop(() => {
      stats1.begin();
      stats2.begin();
      stats3.begin();
      this.renderer.render(this.scene, this.camera);
      stats1.end();
      stats2.end();
      stats3.end();
    });

    // 监听视角变化属性
    this.eventHandler.$on("visionChange", this.handleVisionChange.bind(this));

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
    showPt(show) {
      if (show) {
        this.scene.add(this.ptGroup);
      } else {
        this.scene.remove(this.ptGroup);
      }
    },
    minViewDis(dis) {
      this.updateGeom();
    },
  },
  computed: {
    ...mapState([
      "showFrame",
      "showAxis",
      "showOriData",
      "showPt",
      "minViewDis",
    ]),
  },
  methods: {
    onViewChange() {
      this.updateGeom();
      this.eventHandler.$emit("viewChange", this.camera);
    },
    handleVisionChange(type, angle) {
      const delta = ((2 * Math.PI) / 180) * angle;
      if (type === "top") {
        this.controls.rotateUp(delta);
      } else if (type === "bottom") {
        this.controls.rotateUp(-delta);
      } else if (type === "left") {
        this.controls.rotateLeft(delta);
      } else if (type === "right") {
        this.controls.rotateLeft(-delta);
      }
      this.controls.update();
    },
    init({ data, minX, minY, maxX, maxY }) {
      let points = data.map((pt) =>
        this.mapCoordType(pt, { minX, minY, maxX, maxY })
      );
      this.oriGeom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          points.reduce((prev, curr) => {
            return prev.concat([curr[0], 0, curr[1]]);
          }, []),
          3
        )
      );
      this.oriMesh = new THREE.Line(this.oriGeom, this.oriMaterial);
      this.rankedLine = new QuadTree(points);
      points.map((pt) => this.drawPt(pt[0], pt[1]));
      this.updateGeom();
    },
    resetRenderer() {
      let canvas = document.getElementById("terrain");
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
    drawPt(x, y) {
      let geom = new THREE.SphereBufferGeometry(0.005, 32, 32);
      let mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      let pos = [x, 0, y];
      let mat4 = new THREE.Matrix4();
      mat4.compose(
        new THREE.Vector3(...pos),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1)
      );
      geom.applyMatrix4(mat4);
      let mesh = new THREE.Mesh(geom, mat);
      this.ptGroup.add(mesh);
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
        points = this.rankedLine.traverse(
          this.drawBound,
          this.drawHint,
          this.camera,
          this.minViewDis
        );
      } else {
        points = this.rankedLine.traverse(
          () => {},
          this.drawHint,
          this.camera,
          this.minViewDis
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
@header-height: 50px;
@footer-height: 50px;
.terrain-wrap {
  display: flex;
  flex-direction: column;
  position: relative;
  #terrain {
    width: 100% !important;
    height: 100% !important;
    outline: none;
    border-bottom: 1px solid #eee;
  }
  .terrain-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: black;
    color: white;
    &-item {
      &-title {
        font-weight: bold;
      }
      &-chart {
        pointer-events: none;
      }
    }
  }
}
</style>
