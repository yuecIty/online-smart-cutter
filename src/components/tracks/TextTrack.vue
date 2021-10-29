<template>
  <div
    class="textTrack"
    :id="'textTrack' + trackIndex"
    @dragenter="handleTextDragEnter"
    @dragover="handleTextDragOver"
    @dragend="handleTextDragEnd"
    @drop="handleTextDrop"
  >
    <div
      v-for="(item, index) in trackList"
      :key="item.seq + '' + index"
      class="text-container"
    >
      <div
        class="text-clip"
        :id="'text' + index"
        :ref="'text' + index"
        @click="handleClick($event, index)"
        @mousedown="handleMouseDown($event, index, true)"
        :draggable="true"
        @dragstart="handleTextDragStart({
          e: $event,
          item: item,
          index: index,
          trackIndex: trackIndex,
          list: 'textTrackList',
          prefix: 'text',
          trackId: 'textTrack',
          isTrackDrag: true
        })"
        @drag="handleTrackTextDragging"
      >
        <span class="pic-other">{{ item.text }}</span>
        <div
          v-if="selected.type === 'textTrackList' && selected.index === index"
          v-resize
          class="pic-resizable-right"
        ></div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex'
export default {
  props: {
    trackIndex: {
      type: Number,
      default: 0
    },
    trackList: {
      type: Array,
      default: function () {}
    }
  },
  directives: {
    resize: function (e, bingding, vnode) {
      let holder = e
      holder.onmousedown = (e) => {
        const distanceX = e.clientX - holder.offsetLeft
        const target = vnode.context.$refs['text' + vnode.context.selected.index][0]
        vnode.context.handleTrackResize()
        document.onmousemove = (e) => {
          e.preventDefault()
          const range = e.clientX - distanceX
          if (range < 5) {
            return false
          }
          vnode.context.handleResize(target, range)
        }
        document.onmouseup = () => {
          document.onmousemove = null
          document.onmouseup = null
          vnode.context.handleTrackResize()
          vnode.context.handleResizeEnd()
        }
      }
    }
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState({
      selected: state => state.selected,
      // textTrackList: state => state.textTrackList,
      isTextActive: state => state.isTextActive
    })
  },
  watch: {
    'trackList': function (val) {
      this.$nextTick(() => {
        const selectedIndex = val.findIndex(item => {
          return item.isSelected
        })
        if (selectedIndex !== -1) {
          val[selectedIndex].isSelected = false
          const e = this.$refs['text' + selectedIndex][0]
          this.handleMouseDown(e, selectedIndex, false)
        }
      })
    }
  },
  methods: {
    ...mapMutations({
      handleTextDragEnter: 'dragTrackEnter',
      handleTextDragEnd: 'trackDragEnd',
      handleTextDragStart: 'dragStart',
      handleTrackTextDragging: 'trackDragging',
      handleTextDrop: 'drop',
      handleTrackResize: 'isTrackResizeInvert'
    }),
    handleTextDragOver (e) {
      this.$store.commit('dragTrackOver', { e: e, vm: this })
    },
    handleResize (element, newWidth) {
      this.$store.commit('trackBlockResize', { element: element, newWidth: newWidth, list: 'textTrackList', prefix: 'text', vm: this })
    },
    handleResizeEnd () {
      this.$store.commit('getList')
    },
    handleClick (e, index) {
      let realE = e
      if (!e.target || e.target.className !== 'text-clip') {
        realE = this.$refs['text' + index][0]
      }
      this.$emit('click-text', realE, index, this.trackIndex, 'textTrackList', 'textTab', 'text')
    },
    handleMouseDown (e, index, isNeedTab) {
      // isNeedTab: 用于区分是否需要激活对应DRR - 在轨道拖拽操作中不必激活
      let realE = e
      if (!e.target || e.target.className !== 'text-clip') {
        realE = this.$refs['text' + index][0]
      }
      this.$emit('mousedown-text', realE, index, this.trackIndex, 'text', isNeedTab)
    }
  }
}
</script>
<style lang="stylus" scoped>
.textTrack
  height 28px
.text-container
  position absolute
  display inline-block
  width 0px
  line-height 28px
  font-size 13px
  color #333
.text-clip
  display inline-block
  text-align center
  border-radius 5px
  // border 1px solid #ccc
  box-shadow #ccc 0px 0px 1px 1px inset
  white-space nowrap
  overflow hidden
  text-overflow ellipsis
  cursor pointer
  &:hover
    color #26CB51
  &:focus
    outline 0px
.pic-other
  pointer-events none
.pic-resizable-right
  position absolute
  top 0px
  right -5px
  width 10px
  height 28px
  cursor col-resize
  z-index 4
</style>
