<template>
  <div class="control" :class="classes">
    <div class="control-icon-wrap" @click="handleShowToggle">
      <img
        class="control-icon"
        src="../assets/setting.png"
        draggable="false"
        alt="control.png"
      />
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
        <span>显示Debug框架</span>
        <a-switch defaultChecked @change="handleShowFrame"></a-switch>
      </div>
      <a-divider></a-divider>
      <div class="control-pannel-item">
        <span>显示视觉中心</span>
        <a-switch @change="handleShowAxis"></a-switch>
      </div>
      <a-divider></a-divider>
      <div class="control-pannel-item">
        <span>格网密度</span>
        <a-input-number
          :value="segments"
          :max="maxSegments"
          :min="minSegments"
          @change="handleSegmentsChange"
        ></a-input-number>
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
      minSegments: 0,
      maxSegments: 20,
      segmentsStep: 1,
      minHeightPerScale: 1 / 1000,
      maxHeightPerScale: 1 / 10,
      heightPerScaleStep: 1 / 1000,
      segmentMarks: { 0: 0, 20: 20 }
    };
  },
  computed: {
    ...mapState(["segments", "showFrame"]),
    classes() {
      return `control-${this.showPannel ? "show" : "hide"}`;
    }
  },
  methods: {
    ...mapMutations([
      "setAntialias",
      "setSegments",
      "setShowFrame",
      "setShowAxis"
    ]),
    handleShowToggle() {
      this.showPannel = !this.showPannel;
    },
    handleAntialias(antialias) {
      this.setAntialias(antialias);
    },
    handleSegmentsChange(e) {
      this.setSegments(e);
    },
    handleShowFrame(e) {
      this.setShowFrame(e);
    },
    handleFileUpload() {
      getData(this.$refs.file).then(this.setGeoData);
    },
    handleShowAxis(e) {
      this.setShowAxis(e);
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
