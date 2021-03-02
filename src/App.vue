<template>
  <div id="app">
    <div class="content">
      <div class="header">线状地物LOD</div>
      <Terrain class="terrain" :eventHandler="eventHandler"></Terrain>
    </div>
    <Control class="control" :eventHandler="eventHandler"></Control>
  </div>
</template>

<script>
import Vue from "vue";
import Terrain from "./components/Terrain";
import Control from "./components/Control";
export default {
  name: "app",
  components: { Terrain, Control },
  data() {
    return { eventHandler: new Vue() };
  }
};
</script>

<style lang="less">
@header-height: 50px;

* {
  margin: 0;
}
html,
body,
#app {
  height: 100%;
}
#app {
  display: flex;
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  box-sizing: border-box;

  .content {
    flex: 4;
    .header {
      background: #001529;
      height: @header-height;
      color: white;
      line-height: @header-height;
      font-weight: bold;
      font-size: 20px;
      box-sizing: border-box;
    }
  }
  .control {
    flex: 1;
    background: white;
    border-left: 1px solid #eee;
  }
}
</style>
