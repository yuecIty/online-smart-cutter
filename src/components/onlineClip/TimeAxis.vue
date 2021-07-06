<template>
  <div class="canvas-container">
    <canvas
      v-drag
      ref="timeAxis"
      class="time-canvas"
      :style="{ width: axisWidth + 'px' }"
    ></canvas>
  </div>
</template>
<script>
import { formatDuration } from '@/components/onlineClip/global/functions'
import { mapState } from 'vuex'
export default {
  props: {
    materialDuration: {
      type: Number,
      default: 0
    }
  },
  directives: {
    drag: function (e, bingding, vnode) {
      let canvas = e
      canvas.onmousedown = (e) => {
        if (vnode.context.duration === 0) {
          return false
        }
        const distanceX = e.clientX - e.offsetX
        vnode.context.changePointer(e.offsetX)
        document.onmousemove = (e) => {
          // 清除浏览器默认行为
          e.preventDefault()
          const moveX = e.clientX - distanceX
          vnode.context.changePointer(moveX)
        }
        document.onmouseup = () => {
          document.onmousemove = null
          document.onmouseup = null
        }
      }
    }
  },
  data () {
    return {
      axis: undefined,
      axisCtx: undefined,
      axisWidth: 6000,
      height: 25,
      that: this
    }
  },
  computed: {
    ...mapState({
      timeAxisDuration: state => state.timeAxisDuration,
      trackScale: state => state.trackScale
    })
  },
  watch: {
    timeAxisDuration: {
      handler: function () {
        this.getWidth()
      },
      deep: true
    }
  },
  methods: {
    getWidth () {
      const width = this.timeAxisDuration * this.trackScale + 500
      if (width > 6000) {
        this.axisWidth = width
      } else {
        this.axisWidth = 6000
      }
      this.drawAxis()
    },
    drawAxis () {
      const width = this.trackScale
      const top = this.height / 2
      const height = this.height
      const duration = this.axisWidth
      const scale = this.trackScale
      let canvas = this.axis
      let ctx = this.axisCtx
      let time = 1

      canvas.width = this.axisWidth
      canvas.height = this.height
      ctx.strokeStyle = '#999'
      ctx.fillStyle = '#999'
      ctx.font = '12px Source Han Sans CN'
      ctx.lineWidth = 0.2
      ctx.beginPath()
      ctx.moveTo(0, top)
      ctx.lineTo(0, height)
      ctx.fillText('00:00:00', -18, 10)
      ctx.closePath()
      ctx.stroke()
      ctx.translate(0.5, 0.5)
      while (duration >= time) {
        ctx.beginPath()
        if (time % scale === 0) {
          // 长线和时间; +1是为了让指针、刻度以及trackCurrentTime同步
          ctx.moveTo(time * width + 1, top)
          ctx.lineTo(time * width + 1, height)
          let text = formatDuration(time)
          ctx.fillText(text, time * width - 23, 10)
        } else {
          // 短线
          ctx.moveTo(time * width + 1, height * 3 / 4)
          ctx.lineTo(time * width + 1, height)
        }
        ctx.closePath()
        ctx.stroke()
        time++
      }
    },
    changePointer (left) {
      let duration = left / this.trackScale
      if (duration < 0) duration = 0
      if (duration > this.materialDuration) duration = this.materialDuration
      this.$emit('move-by-axis', duration)
    }
  },
  mounted () {
    this.axis = this.$refs.timeAxis
    this.axisCtx = this.$refs.timeAxis.getContext('2d')
    this.drawAxis()
  }
}
</script>
<style lang="stylus" scoped>
.canvas-container
  width 100%
  height 30px
  background #000000
.time-canvas
  // position fixed
  // z-index 2
  height 25px
  border-bottom 1px solid #888
</style>
