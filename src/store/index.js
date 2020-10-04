import Vue from "vue"
import Vuex from "vuex"

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        antialias: true,
        segments: 10,
        showFrame: true,
        showAxis: true,
    },
    mutations: {
        setAntialias(state, antialias) {
            state.antialias = antialias
        },
        setSegments(state, segments) {
            state.segments = segments
        },
        setShowFrame(state, showFrame) {
            state.showFrame = showFrame
        },
        setShowAxis(state, showAxis) {
            state.showAxis = showAxis
        },
    },
    actions: {},
    modules: {},
})
