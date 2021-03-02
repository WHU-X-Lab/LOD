import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    minViewDis: 0.001,
    showFrame: true,
    showOriData: false
  },
  mutations: {
    setMinViewDis(state, minViewDis) {
      state.minViewDis = minViewDis;
    },
    setShowFrame(state, showFrame) {
      state.showFrame = showFrame;
    },
    setShowOriData(state, showOriData) {
      state.showOriData = showOriData;
    }
  },
  actions: {},
  modules: {}
});
