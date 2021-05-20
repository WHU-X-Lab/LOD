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
import getData from "../data";
import { Quadtree, resources, transCoord } from "../view";
import { addDensity } from "../util";

const hupo = require("../data/hupo");
const hupo2 = require("../data/hupo2");
const quadtrees = [];

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
      ptGroup: null,
      geom: null,
      mat: null,
      mesh: null,
      oriMesh: null,
      distortMeshGroup: null,
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
    this.distortMeshGroup = new THREE.Group();

    // <DEBUG> wireframe
    this.resetGroup();

    // <Main>
    this.oriMesh = new THREE.Group();

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
    distort() {
      this.updateGeom();
    },
    smooth() {
      this.updateGeom();
    },
    minViewDis() {
      this.updateGeom();
    },
    ss() {
      this.updateGeom();
    },
    sl() {
      this.updateGeom();
    },
    r0() {
      this.updateGeom();
    },
    r1() {
      this.updateGeom();
    },
    centerX() {
      this.updateGeom();
    },
    centerY() {
      this.updateGeom();
    },
  },
  computed: {
    ...mapState([
      "showFrame",
      "showAxis",
      "showOriData",
      "showPt",
      "distort",
      "minViewDis",
      "smooth",
      "ss",
      "sl",
      "r1",
      "r0",
      "centerX",
      "centerY",
    ]),
  },
  methods: {
    onViewChange() {
      this.updateGeom();
      this.eventHandler.$emit("viewChange", quadtrees, this.camera);
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
    init(data) {
      data.map((pts) => {
        let geom = new THREE.BufferGeometry();
        geom.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            pts.reduce((prev, curr) => {
              return prev.concat([curr[0], 0, curr[1]]);
            }, []),
            3
          )
        );
        let mesh = new THREE.Line(geom, resources.mat.oriLine);
        this.oriMesh.add(mesh);
        quadtrees.push(new Quadtree(pts));
        pts.map(this.drawPt.bind(this));
      });

      // hupo.geometries.map((geom) => {
      //   let pts = geom.coordinates;
      //   let g = new THREE.BufferGeometry();
      //   g.setAttribute(
      //     "position",
      //     new THREE.Float32BufferAttribute(
      //       pts.reduce((prev, curr) => {
      //         return prev.concat([curr[0], 0, curr[1]]);
      //       })
      //     ),
      //     []
      //   );
      //   let mesh = new THREE.Line(g, this.oriMesh);
      //   this.oriMesh.add(mesh);
      //   this.quadtrees.push(new QuadTree(pts));
      //   pts.map(this.drawPt.bind(this));
      // });
      // hupo2.geometries.map((geom) => {
      //   let pts = geom.coordinates;
      //   let g = new THREE.BufferGeometry();
      //   g.setAttribute(
      //     "position",
      //     new THREE.Float32BufferAttribute(
      //       pts.reduce((prev, curr) => {
      //         return prev.concat([curr[0], 0, curr[1]]);
      //       })
      //     ),
      //     []
      //   );
      //   let mesh = new THREE.Line(g, this.oriMesh);
      //   this.oriMesh.add(mesh);
      //   this.quadtrees.push(new QuadTree(pts));
      //   pts.map(this.drawPt.bind(this));
      // });
      // this.updateGeom();
      quadtrees.map((quadtree) => {
        quadtree.traverse(
          this.drawBound,
          this.transfer,
          this.camera,
          this.minViewDis
        );
      });
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
    },
    // 以委托的形式绘制格网，原因是方便统一管理全部的格网
    drawBound(bound, deleteBound = false) {
      let boundKey = JSON.stringify(bound);
      let boundMesh = null;
      // 如果动态渲染时需要删除格网
      if (deleteBound) {
        if (!(boundMesh = this.frameGroup.getObjectByName(boundKey))) {
          // console.warn("被删除的格网并不存在");
        } else {
          this.frameGroup.remove(boundMesh);
        }
        return;
      }
      // 如果不删除，首先判断该格网是否存在，若存在，则直接pass
      if (this.frameGroup.getObjectByName(boundKey)) {
        return;
      }
      let boundBuffer = [
        new THREE.Vector2(bound[0], bound[1]),
        new THREE.Vector2(bound[0], bound[3]),
        new THREE.Vector2(bound[2], bound[3]),
        new THREE.Vector2(bound[2], bound[1]),
        new THREE.Vector2(bound[0], bound[1]),
      ];
      let curve = addDensity(boundBuffer);
      let { ss, sl, r0, r1, centerX, centerY } = this;
      if (this.distort) {
        curve = curve.reduce((prev, curr) => {
          let { x, y } = transCoord(
            { x: curr.x, y: curr.y },
            { ss, sl, r0, r1, centerX, centerY }
          );
          return prev.concat([x, 0, y]);
        }, []);
      } else {
        curve = curve.reduce((prev, curr) => {
          return prev.concat([curr.x, 0, curr.y]);
        }, []);
      }

      let geom = new THREE.BufferGeometry();
      let mat = resources.mat.grid;
      geom.setAttribute("position", new THREE.Float32BufferAttribute(curve, 3));
      boundMesh = new THREE.Line(geom, mat);
      boundMesh.name = boundKey;
      this.frameGroup.add(boundMesh);
    },
    drawPt([x, y]) {
      let geom = resources.geom.point;
      let mat = resources.mat.point;
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
    transfer(node) {
      if (this.distort) {
        let { ss, sl, r0, r1, centerX, centerY } = this;
        return transCoord(
          { x: node.x, y: node.y },
          { ss, sl, r0, r1, centerX, centerY }
        );
      } else {
        return node;
      }
    },
    updateGeom() {
      this.resetGroup();
      // quadtrees.map((quadtree) => {
      //   quadtree.dynamicModify(this.drawBound, this.camera, this.minViewDis);
      // });
      quadtrees.map((quadtree, index) => {
        // 遍历四叉树，获取原始点
        let points = null;
        let quadtreeName = "quadtree" + index;
        if (this.showFrame) {
          points = quadtree.traverse(
            this.drawBound,
            this.transfer,
            this.camera,
            this.minViewDis
          );
        } else {
          points = quadtree.traverse(
            () => {},
            this.transfer,
            this.camera,
            this.minViewDis
          );
        }

        // 新建/更新数据
        let mesh = null;
        if (!this.scene.getObjectByName(quadtreeName)) {
          let geom = new THREE.BufferGeometry();
          mesh = new THREE.Line(geom, resources.mat.line);
          mesh.name = quadtreeName;
          this.scene.add(mesh);
        } else {
          mesh = this.scene.getObjectByName(quadtreeName);
        }
        mesh.geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(points, 3)
        );
      });
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
