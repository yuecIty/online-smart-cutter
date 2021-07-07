<template>
  <div>
    <div v-drag class="pointer">
      <div class="head">
        <i class="iconfont icon-biaoqian3"></i>
      </div>
      <div
        class="line"
        :style="{
          zIndex: isDragging ? 0 : 1
        }"
      ></div>
    </div>
  </div>
</template>
<script>
import Various from './global/various'
import { mapState } from 'vuex'
export default {
  props: {
    videoPlay: {
      type: Boolean,
      default: false
    },
    widthRange: {
      type: Number,
      default: 0
    }
  },
  directives: {
    drag: function (e, bingding, vnode) {
      let pointer = e
      const pointerOffsetLeft = vnode.context.translateX
      const trackScale = vnode.context.trackScale
      pointer.onmousedown = e => {
        const widthRange = vnode.context.widthRange
        // 鼠标相对元素位置
        const distanceX = e.clientX - pointerOffsetLeft
        document.onmousemove = e => {
          // 清除浏览器默认行为
          e.preventDefault()

          const videoPlay = vnode.context.videoPlay
          // 判断指针是否处于可移动状态
          if (!widthRange) {
            return false
          }
          if (videoPlay) {
            vnode.context.that.$emit('pause-video')
          }

          // 计算指针新位移
          let left = e.clientX - distanceX
          if (left < 0) left = 0
          if (left > widthRange) left = widthRange - 1
          vnode.context.translateX = left
          pointer.style.transform = `translate(${vnode.context.translateX}px, ${vnode.context.translateY}px)`
          // 获得playing-
          vnode.context.judgePlayingTarget()
          // 传递指针新位移
          const pointerDuration = pointerOffsetLeft / trackScale
          vnode.context.that.$emit('set-pointer-track', pointerOffsetLeft, pointerDuration)
        }
        document.onmouseup = () => {
          // 清除监听 - 防止松开鼠标后仍移动
          document.onmousemove = null
          document.onmouseup = null
          if (!widthRange) {
            return false
          }
          // 获得playing-
          vnode.context.judgePlayingTarget()
          // 传递指针新位移
          const pointerDuration = pointerOffsetLeft / trackScale
          vnode.context.that.$emit('set-pointer-track', pointerOffsetLeft, pointerDuration)
        }
      }
    }
  },
  data () {
    return {
      that: this,
      pointer: undefined,
      transitionList: Various.transitionList,
      tracks: [
        {
          name: 'material',
          list: 'materialTrackList'
        },
        {
          name: 'picture',
          list: 'pictureTrackList'
        },
        {
          name: 'text',
          list: 'textTrackList'
        },
        {
          name: 'transition',
          list: 'transitionList'
        }
      ],
      translateY: 11, // transform-translateY
      translateX: 0 // transform-translateX
    }
  },
  computed: {
    ...mapState({
      materialTrackList: state => state.materialTrackList,
      pictureTrackList: state => state.pictureTrackList,
      textTrackList: state => state.textTrackList,
      needPointerJudge: state => state.needPointerJudge,
      trackScale: state => state.trackScale,
      isDragging: state => state.isDragging
    })
  },
  watch: {
    'needPointerJudge.isNeed': function (val) {
      // 监听 - 是否有需要读取的playing-
      if (val) {
        const list = this.needPointerJudge.target
        const nameIndex = list.indexOf('TrackList')
        const name = list.slice(0, nameIndex)
        const track = {
          list: list,
          name: name
        }
        this.judgePlaying(track)
        // 信息读取完毕 重置needPointerJudge内数据
        this.$store.commit('isNeedPointerJudging')
      }
    }
  },
  methods: {
    handlePointerYStatic (top) {
      // 指针随滚动条滚动移动 保持相对静止
      this.translateY = top + 11
      this.pointer.style.transform = `translate(${this.translateX}px, ${this.translateY}px)`
    },
    moveWhenVideoPlay (duration) {
      // 通过duration 更新指针位移
      const left = duration * this.trackScale
      this.translateX = left
      this.pointer.style.transform = `translate(${this.translateX}px, ${this.translateY}px)`
    },
    judgePlayingTarget () {
      // 获取所有的playing-
      this.tracks.forEach(item => {
        this.judgePlaying(item)
      })
    },
    judgePlaying (track) {
      // 获取playing-
      const offsetLeft = this.pointer.offsetLeft
      const list = track.list
      const name = track.name
      if (list === 'transitionList') {
        this[list] = Various.transitionList
      }
      let index = null
      const length = this[list].length
      if (!length) {
        return false
      }

      if (list === 'materialTrackList' || list === 'transitionList') {
        // 兼容未多轨道化的视频轨道
        index = this[list].findIndex(item => {
          const pointerDuration = offsetLeft / this.trackScale
          return item.trackStartTime <= pointerDuration && item.trackEndTime > pointerDuration
        })
        const target = index === -1 ? undefined : this[list][index]
        this.$emit('current-' + name, target, index)
        return true
      }

      // 记录同类型多轨道的playing-
      let tempTargetList = []
      let tempIndexIndex = []
      for (let i = 0; i < length; i++) {
        index = this[list][i].findIndex(item => {
          const pointerDuration = offsetLeft / this.trackScale
          return item.trackStartTime <= pointerDuration && item.trackEndTime > pointerDuration
        })
        const target = index === -1 ? undefined : this[list][i][index]
        tempTargetList.push(target)
        tempIndexIndex.push(index)
      }
      this.$emit('current-' + name, tempTargetList, tempIndexIndex)
    },
    changePointerLeft (left) {
      // 通过left 更新指针位移
      if (left < 1) left = 1
      if (left > this.widthRange) left = this.widthRange
      // 减去指针宽度
      this.translateX = left - 1
      this.pointer.style.transform = `translate(${this.translateX}px, ${this.translateY}px)`
    }
  },
  mounted () {
    this.pointer = document.querySelector('.pointer')
  }
}
</script>
<style lang="stylus" scoped>
pointer-width = 12px
.pointer
  position absolute
  transform translateY(11px)
  z-index 3
.head
  position absolute
  left -8px
  z-index 3
.icon-biaoqian3
  font-size 19px
  color #BBC4BE
.line
  position absolute
  top 4px
  left 1px
  width 0px
  height 220px
  border-left 1px solid #BBC4BE
  z-index 1
</style>
