import Vue from "vue"
import Vuex from "vuex"

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        minViewDis: 1,
        antialias: true,
        showFrame: true,
        showAxis: false,
        showOriData: false,
    },
    mutations: {
        setMinViewDis(state, minViewDis) {
            state.minViewDis = minViewDis
        },
        setAntialias(state, antialias) {
            state.antialias = antialias
        },
        setShowFrame(state, showFrame) {
            state.showFrame = showFrame
        },
        setShowAxis(state, showAxis) {
            state.showAxis = showAxis
        },
        setShowOriData(state, showOriData) {
            state.showOriData = showOriData
        },
    },
    actions: {},
    modules: {},
})
