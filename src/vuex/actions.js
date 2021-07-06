const actions = {
  getWidthAndHeight(context, index) {
    // 获取贴图比例缩放后的宽高
    let wnh = {}
    let img = new Image()
    img.src = context.state.tempDragTarget.picUrl
    let timer = setInterval(() => {
      if (wnh.width) {
        clearInterval(timer)
        context.commit('tabDragRealAdd', {
          wnh: wnh,
          index: index
        })
      }
      wnh.width = img.width
      wnh.height = img.height
    }, 40)
  },
  setTrackDraw(context, params) {
    // way: 是否对当前list的所有轨道进行绘制
    // clear: 是否清除相关数据
    context.state.vm.$nextTick(() => {
      const state = context.state
      if (params.way) {
        for (let i = 0; i < state[state.list].length; i++) {
          context.commit('trackDraw', i)
        }
      } else {
        context.commit('trackDraw')
      }
      if (params.clear) {
        context.commit('clearDragData')
      }
    })
  },
  setAllTrackDraw(context, params) {
    const list = params.list
    const prefix = params.prefix
    context.state.vm.$nextTick(() => {
      const state = context.state
      for (let i = 0; i < list.length; i++) {
        const realList = state[list[i]]
        state.trackId = prefix[i] + 'Track'
        state.prefix = prefix[i]
        state.list = list[i]
        for (let j = 0; j < realList.length; j++) {
          context.commit('trackDraw', j)
        }
      }
      context.commit('clearDragData')
    })
  },
  setTrackBlockSelect(context, params) {
    params.vm.$nextTick(() => {
      context.commit('trackBlockSelect', params)
    })
  },
  async setNextTrackBlock(context) {
    // 触发页面渲染及轨道显示更新
    await this.dispatch('setTrackDraw', { way: false, clear: false })
    // 选中下一个轨道块
    const state = context.state
    const index = state.selected.index
    const newIndex = index > 0 ? index - 1 : index
    const target = state.vm.$refs[state.trackId][state.selected.trackIndex].$refs[state.prefix + newIndex][0]
    this.commit('trackBlockSelect', {
      e: target,
      index: newIndex,
      trackIndex: state.selected.trackIndex,
      list: state.selected.type,
      vm: state.vm
    })
    // 判断playing-
    state.needPointerJudge.isNeed = true
    state.needPointerJudge.target = state.list
    // 清空相关数据
    context.commit('clearDragData')
  }
}

export default actions