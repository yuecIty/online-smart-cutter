import Vue from 'vue'
import Driver from 'driver.js';
import 'driver.js/dist/driver.min.css';
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.use(ElementUI)

Vue.prototype.$driver = new Driver({
  className: 'scoped-class', // 蒙层类名
  opacity: 0.75,  // 蒙层透明度
  padding: 10,    // 突出的元素padding值
  nextBtnText: '下一步', //下一步的按钮文案
  prevBtnText: '上一步', // 上一步的按钮文案
  doneBtnText: '结束',
  closeBtnText: '关闭',
  stageBackground: '#f7fff9',
  animate: true,  // 在切换上一步或下一步时是否使用动画效果
  allowClose: false, // 是否允许点击蒙层关闭
  keyboardControl: true,
  onNext: (() => {}),      // 下一步需执行
})
