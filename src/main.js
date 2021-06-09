import Vue from "vue"
import App from "./App.vue"
import store from "./store"
import {
    Button,
    Switch,
    Divider,
    Slider,
    InputNumber,
    Tooltip,
    Select,
} from "ant-design-vue"

Vue.use(Button)
Vue.use(Switch)
Vue.use(Divider)
Vue.use(Slider)
Vue.use(InputNumber)
Vue.use(Tooltip)
Vue.use(Select)

Vue.config.productionTip = false

new Vue({
    store,
    render: (h) => h(App),
}).$mount("#app")
