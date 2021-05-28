import Vue from 'vue'
import App from './App.vue'
import store from './vuex/store'
import './assets/fontStyleIcon/iconfont.css'
import './assets/font/font.css'
import '@/assets/global.styl'
import '@/assets/theme/index.css'
import './plugins'

Vue.config.productionTip = false

new Vue({
  store,
  render: h => h(App),
}).$mount('#app')
