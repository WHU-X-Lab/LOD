import Vue from "vue"
import Vuex from "vuex"

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        minViewDis: 0.01, // 0.001
        showFrame: true,
        showOriData: false,
        showPt: false,
        smooth: false,
        distort: false,
        ss: 1,
        sl: 10,
        r0: 0.1,
        r1: 0.3,
        centerX: 0,
        centerY: 0,
    },
    mutations: {
        setMinViewDis(state, minViewDis) {
            state.minViewDis = minViewDis
        },
        setShowFrame(state, showFrame) {
            state.showFrame = showFrame
        },
        setShowOriData(state, showOriData) {
            state.showOriData = showOriData
        },
        setShowPt(state, showPt) {
            state.showPt = showPt
        },
        setSmooth(state, smooth) {
            state.smooth = smooth
        },
        setDistort(state, s) {
            state.distort = s
        },
        setSS(state, ss) {
            state.ss = ss
        },
        setSL(state, sl) {
            state.sl = sl
        },
        setR0(state, r0) {
            state.r0 = r0
        },
        setR1(state, r1) {
            state.r1 = r1
        },
        setCenterX(state, x) {
            state.centerX = x
        },
        setCenterY(state, y) {
            state.centerY = y
        },
    },
    actions: {},
    modules: {},
})
