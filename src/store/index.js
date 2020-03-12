import Vue from "vue"
import Vuex from "vuex"

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        useWireframe: false,
        segments: 100,
        heightPerScale: 1 / 10,
        geoData: null
    },
    mutations: {
        setUseWireFrame(state, use) {
            state.useWireframe = use
        },
        setSegments(state, segments) {
            state.segments = segments
        },
        setHeightPerScale(state, hps) {
            state.heightPerScale = hps
        },
        setGeoData(state, geoData) {
            state.geoData = geoData
        }
    },
    actions: {},
    modules: {}
})
