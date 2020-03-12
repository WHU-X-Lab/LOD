<template>
  <div class="control" :class="classes">
    <div class="control-icon-wrap" @click="handleShowToggle">
      <img class="control-icon" src="../assets/setting.png" draggable="false" alt="control.png" />
      <span>{{ pannelTitle }}</span>
    </div>
    <div v-if="showPannel" class="control-pannel">
      <a-divider></a-divider>
      <label for="file" class="input-btn">上传本地文件</label>
      <input
        ref="file"
        type="file"
        id="file"
        name="file"
        accept=".png, .jpg, .jpeg"
        @change="handleFileUpload"
      />
      <a-divider></a-divider>
      <div class="control-pannel-item">
        <span>使用线框</span>
        <a-switch @change="handleWireToggle"></a-switch>
      </div>
      <a-divider></a-divider>
      <div class="control-pannel-item">
        <span>格网密度</span>
        <a-slider
          :defaultValue="segments"
          :min="minSegments"
          :max="maxSegments"
          :marks="segmentMarks"
          @change="handleSegmentsChange"
        ></a-slider>
      </div>
      <a-divider></a-divider>
      <div class="control-pannel-item">
        <span>高度比</span>
        <a-slider
          :defaultValue="heightPerScale"
          :min="minHeightPerScale"
          :max="maxHeightPerScale"
          :step="heightPerScaleStep"
          :marks="heightPerScaleMarks"
          @change="handleHPSChange"
        ></a-slider>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";
import { getData } from "../data";

export default {
  props: {
    terrain: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      showPannel: false,
      pannelTitle: "控制面板",
      minSegments: 1,
      maxSegments: 100,
      minHeightPerScale: 1 / 1000,
      maxHeightPerScale: 1 / 10,
      heightPerScaleStep: 1 / 1000,
      segmentMarks: { 1: 1, 100: 100 },
      heightPerScaleMarks: { 0.001: 0.001, 0.1: 0.1 }
    };
  },
  computed: {
    ...mapState(["segments", "heightPerScale"]),
    classes() {
      return `control-${this.showPannel ? "show" : "hide"}`;
    }
  },
  methods: {
    ...mapMutations([
      "setUseWireFrame",
      "setSegments",
      "setHeightPerScale",
      "setGeoData"
    ]),
    handleShowToggle() {
      this.showPannel = !this.showPannel;
    },
    handleWireToggle(checked) {
      this.setUseWireFrame(checked);
    },
    handleSegmentsChange(e) {
      this.setSegments(e);
    },
    handleHPSChange(e) {
      this.setHeightPerScale(e);
    },
    handleFileUpload() {
      getData(this.$refs.file).then(this.setGeoData);
    }
  }
};
</script>

<style lang="less" scoped>
.control {
  padding: 10px;
  border-radius: 35px 0 0 35px;
  background: #fff;
  box-shadow: 0 0 10px #ccc;
  transition: all 0.5s;
  z-index: 10000;

  #file {
    display: none;
  }

  &-hide {
    &:hover {
      padding-right: 50px;
    }
  }

  &-show {
    width: 20%;
    height: 100%;
    border-radius: 10px 0 0 10px;
  }

  &-icon {
    width: 50px;
    height: 50px;

    &-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      // color: #1890ff;
      font-size: 18px;
      font-weight: bold;
    }
  }
  &-pannel {
    .input-btn {
      padding: 10px;
      border-radius: 10px;
      color: #fff;
      background: #1890ff;
      font-weight: bold;
    }
    &-item {
      align-items: center;
    }
  }
}
</style>
