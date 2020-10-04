import Vue from "vue"
import App from "./App.vue"
import store from "./store"
import { Switch, Divider, Slider, InputNumber } from "ant-design-vue"

Vue.use(Switch)
Vue.use(Divider)
Vue.use(Slider)
Vue.use(InputNumber)

Vue.config.productionTip = false

new Vue({
    store,
    render: (h) => h(App),
}).$mount("#app")
