<template>
  <div class="transition-container">
    <!-- 正确定位列表 -->
    <ul
      id="typeContainer"
      class="type-container"
      :style="{
        visibility: isShowPopover && isShowUl ? 'visible' : 'hidden',
        transform: 'translate(' + (activeIcon.trackStartTime * trackScale + ulXMove) + 'px, -100%)',
        top: ulTop + 'px'
      }"
    >
      <li>
        <span>时长 </span>
        <el-input-number
          v-model="duration"
          class="input-duration"
          size="mini"
          :controls="false"
          @change="handleDurationChange"
        >
        </el-input-number>
        <span> s</span>
      </li>
      <li
        v-for="item in typeList"
        :key="item.id"
        :class="{
          'li-style': true,
          'active-li': activeIcon.typeId === item.id
        }"
        @click="handleTypeSelect(item)"
      >
        <!-- <el-image
          class="transition-type"
          :src="activeIcon.typeId === item.id ? item.activeImage : item.img"
        ></el-image> -->
        <span> {{ item.label }}</span>
        <i
          class="el-icon-check checked-icon"
          :style="{
            visibility: isShowPopover && isShowUl && activeIcon.typeId === item.id ? 'visible' : 'hidden'
          }"
        ></i>
      </li>
    </ul>
    <div
      v-for="(item, index) in transitionList"
      :key="item.id + '' + item.trackStartTime + index"
      ref="transtionIcon"
      class="transition-icon"
      :id="'icon' + index"
      :style="{
        transform: 'translateX(' + (item.trackStartTime * trackScale - 5) + 'px)',
        width: item.zoomTime * trackScale + 10 + 'px'
      }"
      @click="handlePopoverShow(item, index)"
    >
      <i class="el-icon-more"></i>
    </div>
  </div>
</template>
<script>
import Various from '../global/various'
import { mapState } from 'vuex'
export default {
  props: {
    isSaveOrSubmit: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      trackScale: Various.trackScale,
      isShowPopover: false,
      isShowUl: false,
      transitionList: [],
      typeList: [
        {
          id: 1,
          label: '淡入淡出',
          src: '',
          transitionName: 'displacement',
          duration: 5
        },
        {
          id: 2,
          label: '互换淡入',
          src: '',
          transitionName: 'swap',
          duration: 9
        },
        {
          id: 3,
          label: '往上擦去',
          src: '',
          transitionName: 'wipeUp',
          duration: 15
        },
        {
          id: 4,
          label: '往下擦去',
          src: '',
          transitionName: 'wipeDown',
          duration: 10
        },
        {
          id: 5,
          label: '往左擦去',
          src: '',
          transitionName: 'wipeLeft',
          duration: 10
        },
        {
          id: 6,
          label: '往右擦去',
          src: '',
          transitionName: 'wipeRight',
          duration: 10
        },
        {
          id: 8,
          label: '简单缩放',
          src: '',
          transitionName: 'SimpleZoom',
          duration: 10
        },
        {
          id: 9,
          label: '波纹',
          src: '',
          transitionName: 'ripple',
          duration: 10
        },
        {
          id: 10,
          label: '燃烧',
          src: '',
          transitionName: 'burn',
          duration: 10
        },
        {
          id: 11,
          label: '翻页',
          src: '',
          transitionName: 'InvertedPageCurl',
          duration: 10
        },
        {
          id: 12,
          label: '心形',
          src: '',
          transitionName: 'heart',
          duration: 10
        },
        {
          id: 13,
          label: '圆形',
          src: '',
          transitionName: 'CircleCrop',
          duration: 10
        },
        {
          id: 7,
          label: '无效果',
          src: '',
          transitionName: '',
          duration: 10
        }
      ],
      duration: 1,
      activeIcon: {},
      activeIconIndex: null,
      ulTop: 0,
      ulXMove: 0,
      isInitTransition: false
    }
  },
  computed: {
    ...mapState({
      materialTrackList: state => state.materialTrackList
    })
  },
  watch: {
    materialTrackList: function () {
      if (this.isInitTransition) {
        this.isInitTransition = false
        return true
      }
      this.$nextTick(() => {
        this.getTransitionList()
      })
    }
  },
  methods: {
    handleDurationChange () {
      this.duration = Math.floor(this.duration)
      // 输入值大于过渡的最大时长时: 以最大时长赋值
      if (this.duration > this.activeIcon.maxDuration) {
        this.activeIcon.zoomTime = this.activeIcon.maxDuration
        this.duration = this.activeIcon.maxDuration
      } else {
        this.activeIcon.zoomTime = this.duration
      }
      this.activeIcon.playbackRate = this.activeIcon.videoDuration ? (this.activeIcon.videoDuration / this.activeIcon.zoomTime).toFixed(1) * 1 : 1
      this.activeIcon.trackStartTime = Math.floor(this.activeIcon.originStartTime - this.activeIcon.zoomTime / 2)
      this.activeIcon.trackEndTime = Math.floor(this.activeIcon.trackStartTime + this.activeIcon.zoomTime)
      Various.transitionList = this.transitionList
      this.handleUlPosition(this.activeIconIndex, this.duration * this.trackScale + 10)
    },
    handleTypeSelect (type) {
      this.activeIcon.transitionName = type.transitionName
      this.activeIcon.typeId = type.id
      this.activeIcon.videoDuration = type.duration
      this.activeIcon.playbackRate = (this.activeIcon.videoDuration / this.activeIcon.zoomTime).toFixed(1) * 1
      this.handleIconColor(type, this.activeIconIndex, this.activeIconIndex + 1, false)
      Various.transitionList = this.transitionList
    },
    handlePopoverShow (item, index) {
      this.handleUlPosition(index, item.zoomTime * this.trackScale + 10)
      this.activeIcon = item
      this.activeIconIndex = index
      this.duration = item.zoomTime
      // 过渡默认为无效果
      if (!this.activeIcon.typeId) {
        this.activeIcon.typeId = 7
      }
      this.isShowUl = true
    },
    handleUlPosition (index, iconWidth) {
      // 获取列表位置 减去 过渡图标&箭头宽/高度 以及容器滚动宽度
      const scrollWidth = document.querySelector('.clip-resource').scrollLeft
      const iconTarget = this.$refs.transtionIcon[index]
      const iconTop = iconTarget.getBoundingClientRect().top
      const ulTarget = document.getElementById('typeContainer')
      const ulWidth = ulTarget.getBoundingClientRect().width
      this.ulXMove = iconWidth / 2 - ulWidth / 2 - 5 - scrollWidth
      this.ulTop = iconTop - 25
      ulTarget.style.transform = 'translate(' + (this.activeIcon.trackStartTime * this.trackScale + this.ulXMove) + 'px, -100%)'
    },
    handleIconColor (target, index, length, isArray) {
      for (let i = index; i < length; i++) {
        let realTarget = isArray ? target[i] : target
        const iconTarget = document.getElementById('icon' + i)
        if (iconTarget) {
          iconTarget.style.color = realTarget.typeId !== 7 ? '#26CB51' : '#606266'
        }
      }
    },
    getTransitionList () {
      const tempList = this.materialTrackList.reduce((list, item, index, arr) => {
        // 获取与下一个块相连的块
        if (arr[index + 1] && arr[index].trackEndTime === arr[index + 1].trackStartTime) {
          // 获取过渡允许的的最大时长: 两边更小值的1/2
          const durationOne = arr[index].trackEndTime - arr[index].trackStartTime
          const durationTwo = arr[index + 1].trackEndTime - arr[index + 1].trackStartTime
          const maxDuration = durationOne < durationTwo ? durationOne : durationTwo
          // 当两边更小值过小的情况
          const duration = maxDuration / 2 > 1 ? 1 : maxDuration / 2
          // -1是避免两个转场图标重叠
          const tempItem = {
            id: item.id ? item.id : item.rlsId,
            trackStartTime: item.trackEndTime - duration / 2,
            trackEndTime: item.trackEndTime - duration / 2 + 1,
            originStartTime: item.trackEndTime,
            maxDuration: Math.floor(maxDuration - 1),
            typeId: 7,
            playbackRate: 1,
            zoomTime: Math.floor(duration),
            transitionName: '',
            position: list.length ? list.length + 1 : 1,
            beforeTime: Math.floor(durationOne),
            afterTime: Math.floor(durationTwo)
          }
          list.push(tempItem)
        }
        return list
      }, [])
      this.transitionList = tempList
      this.handleIconColor(tempList, 0, tempList.length, true)
      Various.transitionList = this.transitionList
    },
    initTransition (list) {
      this.isInitTransition = true
      this.transitionList = list
      Various.transitionList = this.transitionList
      this.$nextTick(() => {
        this.handleIconColor(list, 0, list.length, true)
      })
    },
    clickMonitor (e) {
      // 提交剪辑页面出来时 不需要监控了
      if (this.isSaveOrSubmit) {
        return true
      }
      // 5为typeContainer所在的最深层级
      const list = e.path
      let flag = false
      for (let i = 0; i < 5; i++) {
        if (list[i].id === 'typeContainer' || list[i].className === 'transition-icon') {
          flag = true
          break
        }
      }
      // 两个变量控制 避免列表还未移好位置就出现
      if (flag) {
        this.isShowPopover = true
      } else {
        this.isShowPopover = false
        this.isShowUl = false
      }
    },
    scrollMonitor () {
      // 页面出现滚动时 关闭列表 避免定位错误
      if (this.isShowPopover) {
        this.isShowPopover = false
        this.isShowUl = false
      }
    }
  },
  mounted () {
    window.addEventListener('mousedown', this.clickMonitor)
    document.querySelector('.clip-resource').addEventListener('scroll', this.scrollMonitor)
  },
  beforeDestroy () {
    window.removeEventListener('mousedown', this.clickMonitor)
  }
}
</script>
<style lang="stylus" scoped>
.type-container
  position fixed
  padding 10px
  border 1px solid #26CB51
  border-radius 5px
  font-size 13px
  line-height 25px
  background #fff
  z-index 6
.type-container:after
  content ''
  position absolute
  bottom -7px
  left 50%
  width 0px
  height 0px
  transform translateX(-50%)
  border-width 7px 6px 0px
  border-style solid
  border-color #fff transparent transparent
.input-duration
  width 50px
  >>>.el-input__inner
    padding 0px 5px
.li-style
  &:hover
    color #26CB51
    cursor pointer
  span
    padding-left 10px
.active-li
  color #26CB51
.transition-type
  width 20px
  height 20px
  vertical-align middle
.checked-icon
  margin-left 10px
  font-size 17px
  font-weight 600
  vertical-align middle
.transition-icon
  position absolute
  top 18px
  height 20px
  text-align center
  border-radius 5px
  background #f5f7fa
  overflow hidden
  &:hover
    color #26CB51
    cursor pointer
i
  color #606266
</style>
