<template>
  <div class="control">
    <div class="control-title">
      <img src="../assets/setting.png" alt="setting.png" draggable="false" />
      {{ pannelTitle }}
    </div>
    <div class="control-pannel">
      <div class="control-pannel-item">
        <span>显示Debug框架</span>
        <a-switch defaultChecked @change="setShowFrame"></a-switch>
      </div>
      <div class="control-pannel-item">
        <span>显示原数据</span>
        <a-switch @change="setShowOriData"></a-switch>
      </div>
      <div class="control-pannel-item">
        <span>显示点</span>
        <a-switch @change="setShowPt"></a-switch>
      </div>
      <div class="control-pannel-item">
        <span
          ><a-tooltip title="控制格网是否分类的因素，该因素越小，分裂程度越高">
            最小分裂距离</a-tooltip
          >
        </span>
        <a-input-number
          :min="0"
          :max="0.1"
          :value="minViewDis"
          :step="0.001"
          @change="setMinViewDis"
        ></a-input-number>
      </div>
      <div class="control-pannel-item">
        <span>视角变化粒度</span>
        <a-input-number
          :min="1"
          :max="20"
          v-model="angle"
          :step="1"
        ></a-input-number>
      </div>
      <div class="control-pannel-item arrow-group">
        <div>视角控制</div>
        <div class="arrow-line">
          <a-tooltip :title="getBtnTooltip('top')" placement="top">
            <img
              src="../assets/arrow.png"
              alt="arrow.png"
              draggable="false"
              @click="handleViewChange('top')"
            />
          </a-tooltip>
        </div>
        <div class="arrow-line">
          <a-tooltip :title="getBtnTooltip('left')" placement="left">
            <img
              src="../assets/arrow.png"
              alt="arrow.png"
              draggable="false"
              @click="handleViewChange('left')"
            />
          </a-tooltip>
          <a-tooltip :title="getBtnTooltip('right')" placement="bottomRight">
            <img
              src="../assets/arrow.png"
              alt="arrow.png"
              draggable="false"
              @click="handleViewChange('right')"
            />
          </a-tooltip>
        </div>
        <div class="arrow-line">
          <a-tooltip :title="getBtnTooltip('bottom')" placement="bottom">
            <img
              src="../assets/arrow.png"
              alt="arrow.png"
              draggable="false"
              @click="handleViewChange('bottom')"
            />
          </a-tooltip>
        </div>
      </div>
      <div class="control-pannel-item minimap">
        <div class="minimap-wrap">
          <div class="minimap-title">鹰眼图</div>
          <canvas id="minimap" width="100" height="100"></canvas>
          <div class="minimap-desc">
            <div>黄色的锥体表示视锥体</div>
            <div>蓝色的线表示目标区域</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as THREE from "three";
import { mapMutations, mapState } from "vuex";
import { MapControls } from "three/examples/jsm/controls/OrbitControls.js";

export default {
  props: {
    eventHandler: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      pannelTitle: "控制面板",
      angle: 5,
    };
  },
  mounted() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    this.camera.position.set(0, 2, 0);
    let canvas = document.getElementById("minimap");
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setClearColor("#fff");
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.screenSpacePanning = false;

    // display
    let points = [
      [-0.5, -0.5],
      [-0.5, 0.5],
      [0.5, 0.5],
      [0.5, -0.5],
      [-0.5, -0.5],
    ];
    this.mat = new THREE.LineBasicMaterial({
      color: 0x0000ff,
    });
    this.geom = new THREE.BufferGeometry();
    this.geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        points.reduce((prev, curr) => {
          return prev.concat([curr[0], 0, curr[1]]);
        }, []),
        3
      )
    );
    this.mesh = new THREE.Line(this.geom, this.mat);
    this.scene.add(this.mesh);

    this.cameraPtGeom = new THREE.SphereBufferGeometry(0.1, 32, 32);
    this.cameraPtMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.cameraPtMesh = null;

    // render
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });

    let that = this;
    this.eventHandler.$on("viewChange", (camera) => {
      let { position } = camera;
      let pos = [position.x, 0, position.z];
      let mat4 = new THREE.Matrix4();
      mat4.compose(
        new THREE.Vector3(...pos),
        new THREE.Quaternion(),
        new THREE.Vector3(1, 1, 1)
      );
      that.cameraPtGeom.applyMatrix4(mat4);
      that.scene.remove(that.cameraPtMesh);
      that.cameraPtMesh = new THREE.Mesh(that.cameraPtGeom, that.cameraPtMat);
      that.scene.add(that.cameraPtMesh);
    });
  },
  computed: {
    ...mapState(["showFrame", "showOriData", "minViewDis"]),
  },
  methods: {
    ...mapMutations([
      "setShowFrame",
      "setShowOriData",
      "setMinViewDis",
      "setShowPt",
    ]),
    getBtnTooltip(type) {
      const prefix = "向";
      const suffix = "旋转";
      const suffix2 = "度";
      const typeMap = { left: "左", right: "右", top: "上", bottom: "下" };
      return prefix + typeMap[type] + suffix + this.angle + suffix2;
    },
    handleViewChange(type) {
      this.eventHandler.$emit("visionChange", type, this.angle);
    },
  },
};
</script>

<style lang="less" scoped>
@blue: #1e90ff;
@lightblue: #e6f7ff;
@grey: #eee;

.control {
  &-title {
    img {
      width: 30px;
      height: 30px;
    }
    padding: 20px;
    border-bottom: 1px solid @grey;
    font-size: 20px;
    font-weight: bold;
  }
  &-pannel {
    &-item {
      padding: 10px 0;
      border-left: 5px solid white;
      span {
        margin: 10px;
      }
      &:hover {
        border-left: 5px solid @blue;
        background: @lightblue;
        color: @blue;
      }
    }
    .arrow-group {
      img {
        width: 30px;
        height: 30px;
        margin: 0 15px;
        cursor: pointer;
      }

      .arrow-line:nth-child(2) {
        transform: rotate(180deg);
      }
      .arrow-line:nth-child(3) {
        img:nth-child(1) {
          transform: rotate(90deg);
        }
        img:nth-child(2) {
          transform: rotate(-90deg);
        }
      }
    }
    .minimap {
      &-title {
        color: @blue;
      }
      #minimap {
        border: 1px solid @grey;
      }
    }
  }
}
</style>
