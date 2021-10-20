const mutations = {
  // 获取同类型轨道中的最大时长
  getTracksDration(state, trackList) {
    let duration = 0
    for (let i = 0; i < state[trackList].length; i++) {
      const list = state[trackList][i]
      const last = list[list.length - 1] ? list[list.length - 1].trackEndTime : 0
      if (last > duration) {
        duration = last
      }
    }
    const name = trackList.slice(0, trackList.indexOf('Track'))
    this.commit('updateTracksDuration', { name: name, duration: duration })
  },
  // 更新变量值
  updateValue(state, params) {
    state[params.name] = params.value
  },
  // 更新数组内变量
  updateArrayAdd(state, params) {
    if (!isNaN(params.index)) {
      // 指定index添加
      state[params.name].splice(params.index, 0, params.value)
    } else {
      state[params.name].push(params.value)
    }
  },
  // 更新数组内对象变量
  updateArrayObjectAdd(state, params) {
    state[params.name] = { ...params.value }
  },
  // 数组整体重赋值
  updateArrayRevalue(state, params) {
    state[params.name] = JSON.parse(JSON.stringify(params.value))
  },
  // 删除数组值
  updateArrayDelete(state, params) {
    state[params.name].splice(params.index, params.amount)
  },
  // 更新数组内对象变量属性
  updateArrayObjectAttr(state, params) {
    state[params.name][params.index][params.attr] = params.value
  },
  // 更新数组对象变量属性
  updateObjectAttribute(state, params) {
    state[params.name][params.attr] = params.value
  },
  // 获取各类型轨道的最长时长及最大轨道时长
  updateTracksDuration(state, params) {
    state.tracksTime[params.name] = params.duration
    let duration = 0
    for (let item in state.tracksTime) {
      if (state.tracksTime[item] > duration) {
        duration = state.tracksTime[item]
      }
    }
    state.timeAxisDuration = duration
  },
  // 更新指针数据
  updatePointer(state, params) {
    state.pointerLeft = params.pointerLeft
    state.pointerDuration = params.pointerDuration
  },
  // 更新playing- playingMaterial playingPictureIndex playingTextIndex
  updatePlayingTarget(state, params) {
    if (params.index === undefined) {
      // 兼容未多轨道化的轨道数组
      state[params.target] = params.value
    } else {
      state[params.target] = params.value
      state[params.target + 'Index'] = params.index
    }
  },
  // 更新视频轨道块trackStartTime trackEndTime
  updateMateriaTime(state, params) {
    const duration = params.duration
    const index = params.index
    const one = params.operator ? 1 : -1
    const trackStartTime = state.materialTrackList[index].trackStartTime
    const trackEndTime = state.materialTrackList[index].trackEndTime
    state.materialTrackList[index].trackStartTime = (trackStartTime + duration * one).toFixed(1) * 1
    state.materialTrackList[index].trackEndTime = (trackEndTime + duration * one).toFixed(1) * 1
  },
  // 更新转场的时间数据
  updateTransitionDuration(state, duration) {
    let target = state.operatingTransition
    target.zoomTime = duration
    target.playbackRate = target.videoDuration ? (target.videoDuration / duration).toFixed(1) * 1 : 1
    target.trackStartTime = Math.floor(target.originStartTime - duration / 2)
    target.trackEndTime = Math.floor(target.trackStartTime + duration)
  },
  // 更新转场类型
  updateTransitionType(state, type) {
    let target = state.operatingTransition
    target.transitionName = type.transitionName
    target.typeId = type.id
    target.videoDuration = type.duration
    target.playbackRate = (target.videoDuration / target.zoomTime).toFixed(1) * 1
  },
  // 更新DRR的显示分辨率
  updateDrrResolution(state, params) {
    state.proportion = params.width / state.originalWidth
    state.tracks.forEach(item => {
      const list = state[item.list]
      for (let i = 0; i < list.length; i++) {
        // 对相关轨道值更新数值
        list[i].forEach(block => {
          if (item.list !== 'textTrackList') {
            // 字幕不需要改变
            block.nowXAxis = params.proportion * block.nowXAxis
            block.nowYAxis = params.proportion * block.nowYAxis
            block.width = params.proportion * block.width
            block.height = params.proportion * block.height
          }
        })
        // 对正在显示范围的drr更新数值
        const target = state[item.playing][i]
        const resizableContainer = params.vm.$refs[item.drr][0].$refs.resizable
        if (!target || !resizableContainer) {
          return false
        }
        const resizable = resizableContainer[0]
        resizable.left = target.nowXAxis
        resizable.top = target.nowYAxis
        resizable.width = target.width
        resizable.height = target.height
      }
    })
  },
  // 初始化宽度比例
  initProportion(state, width) {
    state.originalWidth = width
  },
  // 初始化转场数组
  initTransitionList(state) {
    state.materialTrackList.forEach((item, index, arr) => {
      // 获取与下一个块相连的块
      if (arr[index + 1] && arr[index].trackEndTime === arr[index + 1].trackStartTime) {
        this.commit('transitionAdd', index)
      }
    })
  },
  // 更新选择块伸缩状态
  isTrackResizeInvert(state) {
    state.isTrackResize = !state.isTrackResize
  },
  // 更新指针是否需要判断playing
  isNeedPointerJudging(state) {
    state.needPointerJudge.isNeed = false
    state.needPointerJudge.target = null
  },
  // 初始化拖拽替换图片
  initDragImage(state) {
    state.dragImage.src = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg=='
  },
  // 初始化轨道Container
  initTrackListContainer(state, params) {
    for (let i = 0; i < params.list.length; i++) {
      state.list = params.list[i]
      state.vm = params.vm
      const nextParams = {
        data: params.data[i],
        videoFrame: params.videoFrame,
        videoInfo: params.videoInfo
      }
      this.commit('initTrackList', nextParams)
      this.commit('getTracksDration', state.list)
    }
    this.dispatch('setAllTrackDraw', params)
  },
  // 初始化轨道数组
  initTrackList(state, params) {
    // 暂时兼容接口未通
    if (!params.data) {
      return false
    }
    const list = JSON.parse(JSON.stringify(params.data))
    let realList = []
    if (state.list === 'pictureTrackList') {
      // 兼容未实现多轨道的贴图
      realList.push(list)
    } else {
      realList = list
    }
    for (let i = 0; i < realList.length; i++) {
      if (!realList[i]) {
        // 跳过无值轨道数据
        continue
      }
      realList[i].forEach(item => {
        const wnh = item.zoom.split(':')
        const widthScale = params.videoFrame.width / params.videoInfo.firstVideoH
        const heightScale = params.videoFrame.height / params.videoInfo.firstVideoV
        item.width = wnh[0] * 1
        item.height = wnh[1] * 1
        item.duration = item.endSecond - item.startSecond
        item.range = item.duration * state.trackScale
        item.realRange = item.duration * state.trackScale
        item.trackStartTime = item.startSecond
        item.trackEndTime = item.endSecond
        item.positionXBegin = item.startSecond * state.trackScale
        item.positionXEnd = item.endSecond * state.trackScale
        item.nowXAxis = widthScale * item.xAxis
        item.nowYAxis = heightScale * item.yAxis
        item.scale = 1
        item.transparency = item.transparency * 1
        // 贴图的特殊属性处理
        if (state.list === 'pictureTrackList') {
          item.fileUrl = item.watermark
          item.transparency = item.transparency * 1
          if (!item.overturn) {
            item.transform = ''
          } else {
            item.transform = item.overturn === 'vflip' ? 'rotateX(180deg)' : 'rotateY(180deg)'
          }
        }
        // 字幕的特殊属性处理
        if (state.list === 'textTrackList') {
          item.fontWeight = item.bold ? 600 : 400
          item.fontStyle = item.italic ? 'italic' : 'normal'
          item.border = item.frame ? 'solid 1px #FFFFFF' : 'none'
          item.textShadow = item.shadowY ? '0px 1.5px #000000' : 'none'
          item.textDecoration = item.underLine ? 'underline' : 'none'
          item.webkitTextStroke = item.borderW ? '1px #000000' : '0px'
        }
      })
      if (i === 0) {
        // 删掉初始化用的第一个空数组
        state[state.list].pop()
      }
      state[state.list].push(realList[i])
    }
  },
  // 清空选择块数据
  clearSelected(state) {
    for (let item in state.selected) {
      state.selected[item] = null
    }
    state.selectedTarget = {}
  },
  // 清除playing-
  clearPlaying(state, params) {
    state[params.target][params.trackIndex] = undefined
    state[params.target + 'Index'][params.trackIndex] = -1
  },
  // 清除所有值
  clearAll(state) {
    state.materialTabList = []
    state.materialTrackList = []
    state.textTrackList = [[]]
    state.pictureTrackList = [[]]
    state.transitionTrackList = []
    state.pointerLeft = 0
    state.pointerDuration = 0
    state.timeAxisDuration = 0
    state.tracksTime.material = 0
    state.tracksTime.picture = 0
    state.tracksTime.text = 0
    this.commit('clearSelected')
  },
  // 清除Drag trackId
  clearDragData(state) {
    state.trackId = null
  },
  // 更新选择块数据
  trackBlockSelect(state, params) {
    // 消除原选择块的boxShadow
    if (state.selected.target) {
      state.selected.target.style.boxShadow = ''
    }
    const realTarget = params.e.target ? params.e.target : params.e
    state.selected.index = params.index
    state.selected.trackIndex = isNaN(params.trackIndex) ? null : params.trackIndex
    state.selected.type = params.list
    state.selected.target = realTarget
    state.selected.width = Math.round(realTarget.getBoundingClientRect().width)
    state.selected.dataURL = realTarget.style ? realTarget.style.backgroundImage : ''
    state.targetTrackIndex = state.selected.trackIndex
    realTarget.style.boxShadow = 'inset 0px 0px 2px 1px #26CB51'
    // 暂时兼容未使用vuex的视频素材轨道
    const realObject = params.realList ? params.realList[params.index] : state[params.list][params.trackIndex][params.index]
    state.selectedTarget = realObject
  },
  // 选择块伸缩判断
  trackBlockResize(state, params) {
    state.list = params.list
    state.vm = params.vm
    state.prefix = params.prefix
    state.trackId = params.prefix + 'Track'

    const index = state.selected.index
    const target = state[params.list][state.selected.trackIndex][index]
    const newWidth = params.newWidth
    const nextToTarget = state[params.list][state.selected.trackIndex][index + 1]
    const originalWidth = params.element.clientWidth
    let rangeLimit = target.fileType === 'video' ? target.range : -1
    let realRange = newWidth
    if (rangeLimit === -1) {
      // 非视频贴图块 - 可无限伸缩
      target.positionXEnd = target.positionXBegin + newWidth
    } else {
      // 视频贴图受本身视频长度限制 有最大拉伸值
      const realWidth = rangeLimit >= newWidth ? newWidth : rangeLimit
      target.positionXEnd = target.positionXBegin + realWidth
      realRange = realWidth
    }
    target.realRange = (target.positionXEnd - target.positionXBegin).toFixed(1) * 1
    params.element.style.width = realRange + 'px'
    // 选择块位置在最末时 伸缩对其他块无影响 无需后续操作
    if (!nextToTarget) {
      return true
    }
    // 当选择块拉长 且改变的长度大于两选择块之间的距离 则后块需要后移
    const changeWidth = realRange - originalWidth
    if (realRange > originalWidth && changeWidth > (nextToTarget.positionXBegin - target.positionXEnd)) {
      this.commit('trackBlockResizeMove', changeWidth)
    }
  },
  // 处理选择快伸缩
  trackBlockResizeMove(state, changeWidth) {
    // 轨道块伸长 所在间隔不够时 后移
    let list = state[state.list][state.selected.trackIndex]
    for (let i = state.selected.index + 1; i < list.length; i++) {
      list[i].positionXBegin += changeWidth
      list[i].positionXEnd += changeWidth
    }
    state.isTrackResize = true
    this.commit('trackDraw')
  },
  // 处理选择块删除
  trackBlockDelete(state, params) {
    state.vm = params.vm
    state.list = state.selected.type
    state.prefix = params.prefix
    state.trackId = params.trackId

    let list = state[state.selected.type][state.selected.trackIndex]
    const index = state.selected.index
    // 当前轨道为空时 不操作
    if (!list.length) {
      return false
    }
    // 删除所选轨道块
    list.splice(index, 1)
    // 重设轨道块seq
    list.forEach((item, index) => {
      item.seq = index + 1
    })
    // 更新trackTime
    this.commit('getTracksDration', state.list)
    if (!list.length) {
      // 当前轨道删减后为空 清除选中及各种状态
      this.commit('clearSelected')
      return true
    }
    // 当前轨道还有块时 选中定位到旁边块
    this.dispatch('setNextTrackBlock')
  },
  // 开始拖拽
  dragStart(state, params) {
    const e = params.e
    const item = params.item
    const index = params.index

    e.dataTransfer.setData('Text', index)
    // 用全透明图片替换掉默认的半透明图片
    e.dataTransfer.setDragImage(state.dragImage, 0, 0)

    state.isTrackDrag = params.isTrackDrag
    state.prefix = params.prefix
    state.list = params.list
    state.trackId = params.trackId
    state.dragTarget = item
    state.isDropZone = false
    state.isDragDrop = false
    state.isDragging = true

    const positionRect = e.target.getBoundingClientRect()
    if (state.isTrackDrag) {
      // 当前为轨道dragStart时
      state.originalElement = e.target
      state.picturePosition.y = positionRect.top
      state.isDragFromTab = false
      state.trackIndex = params.trackIndex
      state.dragIndex = index
      const playingName = 'playing' + state.prefix.slice(0, 1).toUpperCase() + state.prefix.slice(1)
      if (state[playingName][state.trackIndex] && state[playingName][state.trackIndex].seq === index + 1) {
        state.dragPlayingName = state.prefix
      }
    } else {
      // 当前为tabs标签页dragStart时
      state.isDragFromTab = true
      state.trackIndex = null
      state.dragIndex = null
    }

    // 设置跟随鼠标的元素及样式
    state.mouseElement = document.createElement('DIV')
    state.dragTranslateX = positionRect.left
    if (!item.duration) {
      state.dragWidth = state.defaultPicWidth
    } else {
      state.dragWidth = item.realRange ? item.realRange : item.duration * state.trackScale
    }
    let mouseElementStyle = `
      position: fixed;
      top: 0px;
      left: 0px;
      z-index: 9999;
      pointer-events: none;
      background-size: auto 100%;
      border-radius: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: ${state.dragWidth}px;
      transform: translate(${positionRect.left}px, ${positionRect.top}px);
    `
    if (state.prefix === 'picture') {
      mouseElementStyle += `
        height: ${state.defaultPicHeight}px;
        background-image: url(${item.picUrl});
        background-color: #000000;
      `
    }
    if (state.prefix === 'text') {
      mouseElementStyle += `
        font-size: 13px;
        height: ${state.defaultTextHeight}px;
        line-height: ${state.defaultTextHeight}px;
        background-color: #F2F2F2;
        text-align: center;
        box-shadow: inset 0px 0px 2px 1px #26CB51;
        color: #333333;
      `
      state.mouseElement.innerText = item.text
    }
    state.mouseElement.style = mouseElementStyle
    // 添加元素到DOM
    document.body.appendChild(state.mouseElement)
  },
  // tab-拖拽中
  tabDragging(state, e) {
    e.preventDefault()
    // 获取拖拽移动方向及当前鼠标位置
    const clientX = e.clientX
    state.direction = clientX - state.dragTranslateX
    state.dragTranslateX = clientX
    // 在dropZone外拖拽时 元素位置即鼠标位置
    if (!state.isDropZone) {
      state.mouseElement.style.transform = 'translate(' + clientX + 'px,' + e.clientY + 'px)'
    }
  },
  // track-拖拽中
  trackDragging(state, e) {
    // 获取拖拽移动方向及当前鼠标位置
    const clientX = e.clientX
    state.direction = clientX - state.dragTranslateX
    state.dragTranslateX = clientX
    // 隐藏轨道上的拖拽目标
    state.originalElement.style.visibility = 'hidden'
  },
  // 拖拽块进入轨道区域
  dragTrackEnter(state, e) {
    // 须在对应轨道类型操作
    if (e.target.className !== state.trackId) {
      return false
    }
    // 获取对应的轨道index 5为Track字符串的长度
    const index = e.target.id.indexOf('Track')
    state.targetTrackIndex = e.target.id.slice(index + 5) * 1
    // 拖拽元素进入dropZone 添加boxShadow
    let target = state.mouseElement
    target.style.boxShadow = 'inset 0px 0px 2px 1px #26CB51'
  },
  // 拖拽块在轨道区域移动判断
  dragTrackOver(state, params) {
    // 须在对应轨道操作
    console.log(params.e.target.className, state.trackId)
    if (params.e.target.className !== state.trackId) {
      return false
    }
    params.e.preventDefault()
    state.vm = params.vm

    state.isDropZone = true
    this.commit('draggingMove')
  },
  // 拖拽块在轨道移动的处理
  draggingMove(state) {
    const track = document.getElementById(state.trackId + state.targetTrackIndex)
    const trackPosition = track.getBoundingClientRect()
    const iconWidth = trackPosition.left
    const dragWidth = state.dragWidth
    const element = state.mouseElement
    // 需减去左侧图标列表的宽度 获得轨道贴图块真正x坐标
    const dragTranslateX = state.dragTranslateX
    const realX = (dragTranslateX - iconWidth).toFixed(1) * 1
    const endX = (realX + dragWidth).toFixed(1) * 1
    const list = state[state.list][state.targetTrackIndex]
    state.iconWidth = iconWidth
    state.picturePosition.y = trackPosition.top

    let targetOne = null // 当前块 与拖拽块产生冲突的轨道块
    let targetTwo = null // 比较块 用于计算与当前块的间隔
    let targetRange = null // 当前块与比较块的间隔
    let lengthCompare = null // targetRange与拖拽块长度的比较
    let realWidth = null // 拖拽块的新宽度
    let newTranslateX = null // 拖拽块的新x坐标
    let canMove = false // 冲突下是否可以产生移动

    // 判断鼠标在不在 轨道块,若在 得出index
    const indexOnBlock = list.findIndex((item, index) => {
      const rightOne = endX >= item.positionXBegin && endX <= item.positionXEnd
      const leftOne = realX >= item.positionXBegin && realX <= item.positionXEnd
      const rightTwo = item.positionXBegin >= realX && item.positionXBegin <= endX
      const leftTwo = item.positionXEnd >= realX && item.positionXEnd <= endX
      const targetIndex = state.targetTrackIndex === state.trackIndex ? index !== state.dragIndex : 1
      return targetIndex && (rightOne || leftOne || rightTwo || leftTwo)
    })
    // 鼠标在轨道块 获取当前块与比较块 得到块间隔
    if (indexOnBlock !== -1) {
      targetOne = list[indexOnBlock]
      if (state.direction >= 0) {
        targetTwo = (state.targetTrackIndex === state.trackIndex && indexOnBlock + 1 !== state.dragIndex) || state.targetTrackIndex !== state.trackIndex ? list[indexOnBlock + 1] : list[indexOnBlock + 2]
        canMove = realX >= targetOne.positionXBegin + targetOne.realRange / 2
      } else {
        targetTwo = (state.targetTrackIndex === state.trackIndex && indexOnBlock - 1 !== state.dragIndex) || state.targetTrackIndex !== state.trackIndex ? list[indexOnBlock - 1] : list[indexOnBlock - 2]
        canMove = realX <= targetOne.positionXBegin + targetOne.realRange / 2
      }
      if (state.direction === 0) {
        canMove = true
      }
      if (state.isDragFromTab && !canMove) {
        element.style.transform = 'translate(' + dragTranslateX + 'px,' + state.picturePosition.y + 'px)'
      }
      // 比较块undefined时
      if (!targetTwo) {
        // 鼠标在轨道块 且 下一个块undefined -> 当前比较块为最末
        if (state.direction > 0 && canMove) {
          // console.log('鼠标在轨道块 且 下一个块undefined -> 当前比较块为最末')
          newTranslateX = targetOne.positionXEnd + iconWidth
          element.style.transform = 'translate(' + newTranslateX + 'px,' + state.picturePosition.y + 'px)'
          return true
        }
        if (state.direction < 0 && canMove) {
          // 鼠标在轨道块 且 上一个块undefined -> 当前比较块为最前
          if (targetOne.positionXBegin < 5) {
            // console.log('鼠标在轨道块 且 上一个块undefined -> 当前比较块为最前 原长度挤')
            // this.handleTranslateChange(indexOnBlock, list.length - 1, true, dragWidth)
            // element.style.transform = 'translate(' + iconWidth + 'px,' + state.picturePosition.y + 'px)'
            return true
          }
          lengthCompare = targetOne.positionXBegin - dragWidth
          realWidth = lengthCompare > 0 ? dragWidth : targetOne.positionXBegin
          newTranslateX = targetOne.positionXBegin - realWidth + iconWidth
          state.dragWidth = realWidth
          element.style.width = realWidth + 'px'
          element.style.transform = 'translate(' + newTranslateX + 'px,' + state.picturePosition.y + 'px)'
          // console.log('鼠标在轨道块 且 上一个块undefined -> 当前比较块为最前 改长度放')
          return true
        }
      } else {
        // 比较块存在时
        targetRange = state.direction >= 0 ? targetTwo.positionXBegin - targetOne.positionXEnd : targetOne.positionXBegin - targetTwo.positionXEnd
        if (targetRange < 5) {
          // console.log('鼠标在轨道块 块间隔不够 原长度挤')
          // this.handleTranslateChange(indexOnBlock, list.length - 1, true, dragWidth)
          // element.style.transform = 'translate(' + (targetOne.positionXEnd + iconWidth) + 'px,' + state.picturePosition.y + 'px)'
          return true
        }
        lengthCompare = targetRange - dragWidth
        if (state.direction > 0 && canMove) {
          realWidth = lengthCompare > 0 ? dragWidth : targetRange
          newTranslateX = targetOne.positionXEnd + iconWidth
          state.dragWidth = realWidth
          element.style.width = realWidth + 'px'
          element.style.transform = 'translate(' + newTranslateX + 'px,' + state.picturePosition.y + 'px)'
          // console.log('鼠标在轨道块 块间隔够 方向为右 改长度放')
          return true
        }
        if (state.direction < 0 && canMove) {
          realWidth = lengthCompare > 0 ? dragWidth : targetRange
          newTranslateX = targetOne.positionXBegin - realWidth + iconWidth
          state.dragWidth = realWidth
          element.style.width = realWidth + 'px'
          element.style.transform = 'translate(' + newTranslateX + 'px,' + state.picturePosition.y + 'px)'
          // console.log('鼠标在轨道块 块间隔够 方向为左 改长度放')
          return true
        }
      }
    }
    if (indexOnBlock === -1) {
      element.style.transform = 'translate(' + dragTranslateX + 'px,' + state.picturePosition.y + 'px)'
    }
  },
  // 放置拖拽块
  drop(state, e) {
    e.preventDefault()

    state.isDropZone = false
    state.isDragDrop = true
    state.isDragging = false
    const target = Object.assign({}, state.dragTarget)
    const positionRect = state.mouseElement.getBoundingClientRect()
    // 设置当前拖拽块的新坐标
    // 处理"归零"问题
    target.positionXBegin = positionRect.left - state.iconWidth <= 0.8 ? 0 : positionRect.left - state.iconWidth
    target.positionXEnd = target.positionXBegin + positionRect.width
    if (state.isDragFromTab) {
      state.isDragFromTab = false
    }
    // 不允许重叠放置
    this.commit('judgeConflicBlock', target)
    if (state.isConflic) {
      state.vm.$message({
        type: 'warning',
        message: '该区域空位长度不够，不支持直接放置'
      })
      document.body.removeChild(state.mouseElement)
      state.originalElement.style.visibility = 'visible'
      state.mouseElement = null
      return true
    }
    // 重新获得playing- 实时更新当前播放区域的drr显示
    state.needPointerJudge.isNeed = true
    state.needPointerJudge.target = state.list

    if (state.isTrackDrag) {
      state.originalElement.style.visibility = 'visible'
      state.isTrackDrag = false
      state.dragPlayingName = null
      this.commit('trackDragRealEnd', { target: target, index: e.dataTransfer.getData('Text') })
    } else {
      state.dragTarget = {}
      this.commit('tabDragAdd', { target: target, index: undefined })
    }
  },
  // tab-拖拽块添加判断与预处理
  tabDragAdd(state, params) {
    if (params.iconAdd) {
      state.trackIndex = null
    }
    for (let key in params) {
      state[key] = params[key]
    }
    const target = params.target
    if (!target.duration) {
      target.duration = state.defaultPicWidth / state.trackScale
    }
    target.range = (target.duration * state.trackScale).toFixed(1) * 1
    target.realRange = target.range
    target.width = state.defaultPicWidth
    target.nowXAxis = 0
    target.nowYAxis = 0
    target.whirl = 0
    target.scale = 1
    target.transparency = 1
    if (state.list === 'pictureTrackList') {
      target.overturn = ''
    }
    state.tempDragTarget = target
    if (state.list === 'pictureTrackList') {
      // 贴图需要根据原图比例设置显示宽高
      this.dispatch('getWidthAndHeight', params.index)
    } else {
      this.commit('tabDragRealAdd', {
        wnh: {
          width: state.defaultPicWidth,
          height: state.defaultDrrHeight
        },
        index: params.index
      })
    }
  },
  // tab-拖拽块添加
  tabDragRealAdd(state, parmas) {
    state.tempDragTarget.height = state.tempDragTarget.width / parmas.wnh.width * parmas.wnh.height
    state.tempDragTarget.zoom = state.tempDragTarget.width + ':' + state.tempDragTarget.height
    if (isNaN(parmas.index)) {
      // 不定添加位置的轨道块
      state[state.list][state.targetTrackIndex].push(state.tempDragTarget)
      this.commit('listSort')
    } else {
      // 指定添加位置的轨道块
      state[state.list][state.targetTrackIndex].splice(parmas.index + 1, 0, state.tempDragTarget)
      this.commit('listMove', {
        target: state.tempDragTarget,
        index: parmas.index + 1
      })
    }
  },
  // 轨道块排序
  listSort(state) {
    // 按照在轨时间先后进行排序
    state[state.list][state.targetTrackIndex].sort((item, nextItem) => {
      return item.positionXBegin - nextItem.positionXBegin
    })
    this.commit('getList')
  },
  // 轨道块format及绘制请求
  getList(state) {
    if (state.trackIndex !== null && state.targetTrackIndex !== state.trackIndex) {
      this.commit('formatList', state.targetTrackIndex)
      this.commit('formatList', state.trackIndex)
      this.commit('getTracksDration', state.list)
      this.dispatch('setTrackDraw', { way: true, clear: true })
    } else {
      this.commit('formatList', state.targetTrackIndex)
      this.commit('getTracksDration', state.list)
      this.dispatch('setTrackDraw', { way: false, clear: true })
    }
  },
  // 轨道块format
  formatList(state, listIndex) {
    // 更新轨道数据
    const scale = state.trackScale
    state[state.list][listIndex].forEach((item, index) => {
      item.positionXBegin = (item.positionXBegin).toFixed(1) * 1
      item.positionXEnd = (item.positionXEnd).toFixed(1) * 1
      item.realRange = (item.positionXEnd - item.positionXBegin).toFixed(1) * 1
      item.trackStartTime = (item.positionXBegin / scale).toFixed(1) * 1
      item.trackEndTime = (item.positionXEnd / scale).toFixed(1) * 1
      item.startSecond = item.trackStartTime
      item.endSecond = item.trackEndTime
      item.seq = index + 1
    })
  },
  listMove(state, params) {
    const index = params.index
    const list = state[state.list][state.targetTrackIndex]
    const length = list.length
    const moveLength = params.target.realRange
    const newBeginX = list[index].positionXBegin
    const newEndX = list[index].positionXEnd
    const nextBeginX = list[index + 1] ? list[index + 1].positionXBegin : undefined
    const newWidth = nextBeginX - newBeginX
    // 指针与后一个贴图块的间隔 - 够放新贴图块 直接放
    if (!nextBeginX || nextBeginX >= newEndX) {
      this.commit('getList')
      return true
    }
    // 指针与后一个贴图块的间隔 - 以5px为基准, 不完全够放新贴图块 改变新贴图块长度
    if (newWidth >= 5) {
      list[index].positionXEnd = nextBeginX
      this.commit('getList')
      return true
    }
    // 指针与后一个贴图块的间隔 - 不够放新贴图块 后面的贴图块后移挪位
    for (let i = index + 1; i < length; i++) {
      list[i].positionXBegin += moveLength
      list[i].positionXEnd += moveLength
    }
    this.commit('getList')
  },
  judgeConflicBlock(state, target) {
    const beginX = (target.positionXBegin).toFixed(1) * 1
    const endX = (target.positionXEnd).toFixed(1) * 1
    // 判断所在位置是否已有块
    const coverIndex = state[state.list][state.targetTrackIndex].findIndex((item, index) => {
      const track = state.targetTrackIndex === state.trackIndex ? state.dragIndex !== index : true
      return track && ((beginX > item.positionXBegin && beginX < item.positionXEnd) || (endX > item.positionXBegin && endX < item.positionXEnd))
    })
    const containIndex = state[state.list][state.targetTrackIndex].findIndex((item, index) => {
      const track = state.targetTrackIndex === state.trackIndex ? state.dragIndex !== index : true
      return track && (beginX < item.positionXBegin && endX > item.positionXEnd)
    })
    if (coverIndex !== -1 || containIndex !== -1) {
      state.isConflic = true
    } else {
      state.isConflic = false
    }
  },
  tabDragEnd(state, e) {
    // 拖拽元素已在dropZone 但鼠标在dropZone外松开时 也要放元素
    if (state.isDropZone) {
      this.commit('drop', e)
    }
    // 清空拖拽元素
    if (state.mouseElement) {
      document.body.removeChild(state.mouseElement)
      state.mouseElement = null
    }
  },
  trackDragEnd(state) {
    state.isDragging = false
    state.isDropZone = false
    // 已在dropZone内松开并放置 无需后续处理
    if (state.isDragDrop) {
      return true
    }
    // 未在dropZone内松开并放置时
    const target = Object.assign({}, state.dragTarget)
    const positionRect = state.mouseElement.getBoundingClientRect()
    // 处理"归零"问题
    target.positionXBegin = positionRect.left - state.iconWidth <= 0.8 ? 0 : positionRect.left - state.iconWidth
    target.positionXEnd = target.positionXBegin + positionRect.width
    // 判断是否进入指针区域 重新获得playing- 实时更新当前播放区域的drr显示
    if (state.pointerLeft >= target.positionXBegin && state.pointerLeft <= target.positionXEnd) {
      state.needPointerJudge.isNeed = true
      state.needPointerJudge.target = state.list
    }
    this.commit('trackDragRealEnd', { target: target, index: state.dragIndex })
    state.isTrackDrag = false
    state.dragPlayingName = null
    state.originalElement.style.visibility = 'visible'
  },
  trackDragRealEnd(state, params) {
    const target = params.target
    const index = params.index * 1
    let list = state[state.list][state.trackIndex]
    // 清空拖拽元素
    if (state.mouseElement) {
      document.body.removeChild(state.mouseElement)
    }
    list[index].positionXBegin = target.positionXBegin
    list[index].positionXEnd = target.positionXEnd
    list[index].isSelected = true
    if (state.targetTrackIndex !== state.trackIndex) {
      state[state.list][state.targetTrackIndex].push(list[index])
      state[state.list][state.trackIndex].splice(index, 1)
    }
    state.dragTranslateX = null
    state.dragWidth = null
    state.mouseElement = null
    state.dragIndex = null
    // 更新数据后需重新排序
    this.commit('listSort')
  },
  trackDraw(state, paramsIndex) {
    if (!isNaN(paramsIndex)) {
      state.targetTrackIndex = paramsIndex
    }
    // 画轨道块
    const list = state[state.list][state.targetTrackIndex]
    for (let i = 0; i < list.length; i++) {
      // 获取当前操作的ref名
      const index = state.prefix + i

      const targetPicture = list[i]
      let targetElement = null
      // 根据this设置获取路径
      if (state.vm.$el.id === 'onlineClip') {
        targetElement = state.vm.$refs[state.trackId][state.targetTrackIndex].$refs[index][0]
      } else {
        targetElement = document.querySelector('#' + state.trackId + state.targetTrackIndex).querySelector('#' + index)
      }
      if (state.isTrackDrag || state.isTrackResize) {
        // 只是移动 其他样式无需改变
        targetElement.style.transform = 'translateX(' + targetPicture.positionXBegin + 'px)'
      } else {
        let targetElementStyle = `
          width: ${targetPicture.realRange}px;
          background-size: auto 100%;
          transform: translateX(${targetPicture.positionXBegin}px);
        `
        if (state.prefix === 'picture') {
          targetElementStyle += `
            height: ${state.defaultPicHeight}px;
            background-image: url(${targetPicture.picUrl});
            background-color: #000000;
          `
        }
        if (state.prefix === 'text') {
          targetElementStyle += `
            background: #F2F2F2;
            height: ${state.defaultTextHeight}px;
          `
        }
        targetElement.style = targetElementStyle
      }
    }
  },
  trackAdd(state, params) {
    state[params.name + 'TrackList'].splice(params.index + 1, 0, [])
    this.commit('trackAfter', params)
  },
  trackDelete(state, params) {
    state[params.name + 'TrackList'].splice(params.index, 1)
    this.commit('trackAfter', params)
  },
  trackCopy(state, params) {
    const addTarget = JSON.parse(JSON.stringify(state[params.name + 'TrackList'][params.index]))
    state[params.name + 'TrackList'].splice(params.index + 1, 0, addTarget)
    this.commit('trackAfter', params)
  },
  trackAfter(state, params) {
    state.list = params.list
    state.targetTrackIndex = params.index
    state.vm = params.vm
    state.prefix = params.name
    state.trackId = params.name + 'Track'
    // 重新获得playing- 实时更新当前播放区域的drr显示
    state.needPointerJudge.isNeed = true
    state.needPointerJudge.target = state.list
    this.dispatch('setTrackDraw', { way: true, clear: true })
  },
  drrActive(state, params) {
    state.activeName = params.activeTarget
    state.list = params.list
    state.playingName = params.playingName
    state.vm = params.vm
  },
  drrDragStop(state, params) {
    const resizable = params.vm.$refs.resizable[0]
    let target = state.selectedTarget
    state.vm = params.vm
    state.playingName = params.playingName

    target.nowXAxis = params.left
    target.nowYAxis = params.top
    target.width = resizable.width
    target.height = resizable.height
  },
  drrResizing(state, params) {
    const rect = params.rect
    const resizable = params.vm.$refs.resizable[0]
    state.vm = params.vm
    state.playingName = params.playingName
    if (params.keyCode === 16) {
      const target = state.selectedTarget
      const widthRange = rect.width - target.width
      const heightRange = rect.height - target.height
      if (rect.left !== target.nowXAxis || rect.top !== target.nowYAxis) {
        resizable.left = target.nowXAxis
        resizable.elmX = target.nowXAxis
        resizable.top = target.nowYAxis
        resizable.elmY = target.nowYAxis
      }
      if (widthRange > heightRange) {
        resizable.height = rect.width / target.width * target.height
        resizable.elmH = rect.width / target.width * target.height
      } else {
        resizable.width = rect.height / target.height * target.width
        resizable.elmW = rect.height / target.height * target.width
      }
      return true
    }
    resizable.elmW = rect.width
    resizable.elmH = rect.height
  },
  drrResizeStop(state, params) {
    let selectedTarget = state.selectedTarget

    selectedTarget.nowXAxis = params.left
    selectedTarget.nowYAxis = params.top
    selectedTarget.width = params.width
    selectedTarget.height = params.height
    selectedTarget.zoom = params.width + ':' + params.height

    this.commit('drrElementData', { way: true, index: state.selected.trackIndex })
  },
  drrRotating(state, angle) {
    state.selectedTarget.whirl = angle
    state[state.list][state.selected.trackIndex][state.selectedTarget.seq - 1].whirl = angle
  },
  drrTextChange(state, params) {
    state.textTrackList[params.trackIndex][state.textEditIndex].text = params.text
  },
  drrElementData(state, params) {
    if (!params.way) {
      state.vm = params.vm
      state.playingName = params.playingName
    }
    if ((!params.isSubmit && !state[state.playingName][params.index]) || !state.vm.$refs.resizable || !state.vm.$refs.drrTarget) {
      return false
    }
    const resizable = state.vm.$refs.resizable[0]
    const drrTarget = state.vm.$refs.drrTarget[0]
    const target = params.isSubmit ? params.target : state[state.playingName][params.index]
    if (!resizable || !drrTarget) {
      return false
    }
    const width = params.isSubmit ? target.width * params.scale.widthScale : target.width
    const height = params.isSubmit ? target.height * params.scale.heightScale : target.height
    const x = params.isSubmit ? target.nowXAxis * params.scale.widthScale : target.nowXAxis
    const y = params.isSubmit ? target.nowYAxis * params.scale.heightScale : target.nowYAxis
    resizable.elmW = width
    resizable.elmH = height
    resizable.width = width
    resizable.height = height
    resizable.rotateAngle = target.whirl
    resizable.elmX = x
    resizable.elmY = y
    resizable.left = x
    resizable.top = y
    const targetStyle = drrTarget.$el ? drrTarget.$el.style : drrTarget.style
    targetStyle.transform = target.transform
    targetStyle.opacity = target.transparency
  },
  drrTabRotate(state, angle) {
    const resizable = state.vm.$refs.resizable[0]
    let selectedTarget = state.selectedTarget
    let listTarget = state[state.list][state.selected.trackIndex][state.selectedTarget.seq - 1]

    resizable.rotateAngle = angle
    selectedTarget.whirl = angle
    // 同步更新数组内的数据
    listTarget.whirl = angle
  },
  drrTabBeforeResize(state, lastZoom) {
    // 得到当前缩放比例下贴图的实际大小(即缩放1倍时)
    const resizable = state.vm.$refs.resizable[0]
    const beforeWidth = resizable.width
    const beforeHeight = resizable.height

    // 缩放滑块设为0时 不做事前计算
    if (lastZoom !== 0) {
      state.tabResizedTarget.width = beforeWidth / lastZoom
      state.tabResizedTarget.height = beforeHeight / lastZoom
    }
  },
  drrTabResize(state, zoom) {
    let selectedTarget = state.selectedTarget
    // 缩放为0时 需要进行特殊处理 否则drr组件报错
    selectedTarget.width = state.tabResizedTarget.width * zoom === 0 ? 1 : state.tabResizedTarget.width * zoom
    selectedTarget.height = state.tabResizedTarget.height * zoom === 0 ? 1 : state.tabResizedTarget.width * zoom
    selectedTarget.scale = zoom
    // 获取现在的宽高比
    selectedTarget.zoom = selectedTarget.width + ':' + selectedTarget.height

    this.commit('drrElementData', { way: true, index: state.selected.trackIndex })
  },
  drrTabOpacity(state, opacity) {
    const realTarget = state.vm.$refs.drrTarget ? state.vm.$refs.drrTarget[0] : null
    if (!realTarget) {
      return false
    }
    const targetStyle = realTarget.$el ? realTarget.$el.style : realTarget.style
    targetStyle.opacity = opacity

    let selectedTarget = state.selectedTarget
    selectedTarget.transparency = opacity
  },
  drrTabFlip(state, way) {
    const realTarget = state.vm.$refs.drrTarget ? state.vm.$refs.drrTarget[0] : null
    if (!realTarget) {
      return false
    }
    const targetStyle = realTarget.$el ? realTarget.$el.style : realTarget.style
    const targetOne = 'rotate' + way + '(180deg)' // 对应使用way方向的翻转
    const targetTwo = 'rotate' + way + '(0deg)' // 对应取消way方向的翻转
    const transform = targetStyle.transform

    // 初次设置翻转 对应使用way方向的翻转
    if (!transform) {
      targetStyle.transform = targetOne
      this.commit('drrTabFlipEnd', { transform: targetOne, way: way })
      return true
    }
    // 非初次设置翻转 需知道前次翻转是不是当前方向
    const existWay = transform.indexOf(way)
    // 非初次设置翻转 且不是当前方向 累加transform
    if (existWay === -1) {
      targetStyle.transform += targetOne
      this.commit('drrTabFlipEnd', { transform: targetStyle.transform, way: way })
      return true
    }
    // 非初次设置翻转 且为当前方向 则需知道上次是使用还是取消
    const exist = transform.indexOf(targetOne)
    // 对应处理
    if (exist !== -1) {
      targetStyle.transform = transform.replace(targetOne, targetTwo)
    } else {
      targetStyle.transform = transform.replace(targetTwo, targetOne)
    }
    this.commit('drrTabFlipEnd', { transform: targetStyle.transform, way: way })
  },
  drrTabFlipEnd(state, params) {
    let selectedTarget = state.selectedTarget
    selectedTarget.transform = params.transform
    // 根据当前翻转内容 设置规范的存值
    if (params.transform.indexOf('180') === -1) {
      selectedTarget.overturn = ''
    } else {
      selectedTarget.overturn = params.way === 'X' ? 'vflip' : 'hflip'
    }
  },
  drrTabFontOperation(state, params) {
    // 处理字幕操作标签页 无需分隔样式名的操作
    // 找到正在操作的drr 更新样式 更新数值
    const target = document.querySelector('#textDrr' + state.selected.trackIndex).querySelector('.drr-target')
    if (target) {
      const targetStyle = target.style
      targetStyle[params.styleName] = params.isNeedPx ? params.styleValue + 'px' : params.styleValue
      state.textTrackList[state.selected.trackIndex][state.selected.index][params.styleName] = params.styleValue
    }
  },
  drrTabFontStyle(state, params) {
    // 处理字幕操作标签页 需要分隔样式名的操作
    // 找到正在操作的drr 更新样式 更新数值
    const target = document.querySelector('#textDrr' + state.selected.trackIndex).querySelector('.drr-target')
    if (target) {
      const targetStyle = target.style
      targetStyle[params.styleName] = params.styleValue
      if (!params.isOnly) {
        state.textTrackList[state.selected.trackIndex][state.selected.index][params.styleName] = params.styleValue
      }
      state.textTrackList[state.selected.trackIndex][state.selected.index][params.name] = params.value
    }
  },
  getTransitionMaxDuration(state, params) {
    const durationOne = state.materialTrackList[params.indexOne].trackEndTime - state.materialTrackList[params.indexOne].trackStartTime
    const durationTwo = state.materialTrackList[params.indexTwo].trackEndTime - state.materialTrackList[params.indexTwo].trackStartTime
    const maxDuration = durationOne < durationTwo ? durationOne : durationTwo
    return maxDuration
  },
  materialClip(state) {
    // 当视频轨道块进行裁剪操作时 转场需进行相关的时长更新与新增转场

    const index = state.operationIndex
    // 获取需要修改时长的两个转场对象
    let targetOne = state.transitionTrackList[index - 1]
    let targetTwo = state.transitionTrackList[index]
    // 获取第一个转场对象的最大时长
    const maxDurationOne = this.commit('getTransitionMaxDuration', { indexOne: index - 1, indexTwo: index })
    // 获取第二个转场对象的最大时长
    const maxDurationTwo = this.commit('getTransitionMaxDuration', { indexOne: index + 1, indexTwo: index + 2 })
    // 获取两个转场对象的新时长 - 若原时长比最大时长大 则取最大时长 否则仍为原时长
    const oneDuration = targetOne.zoomTime > maxDurationOne / 2 ? maxDurationOne / 2 : targetOne.zoomTime
    const twoDuration = targetTwo.zoomTime > maxDurationTwo / 2 ? maxDurationTwo / 2 : targetTwo.zoomTime
    // 设置两个转场对象的新时长与新最大时长
    targetOne.zoomTime = Math.floor(oneDuration)
    targetOne.maxDuration = Math.floor(maxDurationOne)
    targetTwo.zoomTime = Math.floor(twoDuration)
    targetTwo.maxDuration = Math.floor(maxDurationTwo)

    // 新增转场对象
    this.commit('transitionAdd', index)
  },
  materialAdd(state) {
    state.transitionTrackList.splice(state.operationIndex - 1, 1)
    this.commit('transitionAdd', state.operationIndex - 1)
    this.commit('transitionAdd', state.operationIndex)
  },
  materialDelete(state) {
    state.transitionTrackList.splice(state.operationIndex, 2)
    this.commit('transitionAdd', state.operationIndex)
  },
  materialSort() {
    this.commit('materialDelete')
    this.commit('materialAdd')
  },
  transitionAdd(state, index) {
    const targetOne = state.materialTrackList[index]
    const targetTwo = state.materialTrackList[index + 1]
    if (!targetOne || !targetTwo) {
      return false
    }
    const trackEndTime = state.materialTrackList[index].trackEndTime
    const durationOne = state.materialTrackList[index].trackEndTime - state.materialTrackList[index].trackStartTime
    const durationTwo = state.materialTrackList[index + 1].trackEndTime - state.materialTrackList[index + 1].trackStartTime
    // 获取新增转场对象的最大时长
    const maxDuration = durationTwo < durationOne ? durationTwo : durationOne
    // 获取过渡允许的的最大时长: 两边更小值的1/2
    const duration = maxDuration / 2 > 1 ? 1 : maxDuration / 2
    const newTarget = {
      trackStartTime: trackEndTime - duration / 2,
      trackEndTime: trackEndTime - duration / 2 + 1,
      originStartTime: trackEndTime,
      maxDuration: Math.floor(maxDuration),
      typeId: 7,
      playbackRate: 1,
      zoomTime: Math.floor(duration),
      transitionName: '',
      position: index,
      beforeTime: Math.floor(durationOne),
      afterTime: Math.floor(durationTwo)
    }
    state.transitionTrackList.splice(index - 1, 0, newTarget)
  }
}

export default mutations