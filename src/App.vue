<template>
  <div id="app">
    <Terrain class="terrain-layout" ref="terrain"></Terrain>
    <Control class="control-layout" :terrain="terrain"></Control>
  </div>
</template>

<script>
import Terrain from "./components/Terrain";
import Control from "./components/Control";
export default {
  name: "app",
  components: { Terrain, Control },
  data() {
    return { terrain: null };
  },
  mounted() {
    this.terrain = this.$refs.terrain;
  }
};
</script>

<style lang="less">
* {
  margin: 0;
}
html,
body,
#app {
  height: 100%;
}
#app {
  position: relative;
  display: flex;
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  box-sizing: border-box;

  .terrain-layout {
    width: 100%;
  }

  .control-layout {
    position: absolute;
    right: 0;
  }

  .custom-pt {
    display: fixed;
    z-index: 1000;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: red;
  }
}
</style>
