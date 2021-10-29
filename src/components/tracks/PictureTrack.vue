<template>
  <div
    class="pictureTrack"
    :id="'pictureTrack' + trackIndex"
    @dragenter="handlePictureDragEnter"
    @dragover="handlePictureDragOver"
    @dragend="handlePictureDragEnd"
    @drop="handlePictureDrop"
  >
    <div
      v-for="(item, index) in trackList"
      :key="item.seq + '' + index"
      class="pic-container"
    >
      <div
        class="pic-clip"
        :id="'picture' + index"
        :ref="'picture' + index"
        :draggable="true"
        @click="handleClick($event, index)"
        @mousedown="handleMouseDown($event, index, true)"
        @dragstart="handleTrackPicDragStart({
          e: $event,
          item: item,
          index: index,
          trackIndex: trackIndex,
          list: 'pictureTrackList',
          prefix: 'picture',
          trackId: 'pictureTrack',
          isTrackDrag: true
        })"
        @drag="handleTrackPicDragging"
      >
        <span class="pic-other">{{ item.title }}</span>
        <div
          v-if="selected.type === 'pictureTrackList' && selected.index === index"
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
    widthRange: {
      type: Number,
      default: 0
    },
    pictureWidth: {
      type: Number,
      default: 0
    },
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
        const target = vnode.context.$refs['picture' + vnode.context.selected.index][0]
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
      selectedTarget: state => state.selectedTarget,
      playingPicture: state => state.playingPicture,
      playingPictureIndex: state => state.playingPictureIndex
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
          const e = this.$refs['picture' + selectedIndex][0]
          this.handleMouseDown(e, selectedIndex, false)
        }
      })
    }
  },
  methods: {
    ...mapMutations({
      handlePictureDragEnter: 'dragTrackEnter',
      handlePictureDragEnd: 'trackDragEnd',
      handleTrackPicDragStart: 'dragStart',
      handleTrackPicDragging: 'trackDragging',
      handlePictureDrop: 'drop',
      handleTrackResize: 'isTrackResizeInvert'
    }),
    handleResize (element, newWidth) {
      this.$store.commit('trackBlockResize', { element: element, newWidth: newWidth, list: 'pictureTrackList', prefix: 'picture', vm: this })
    },
    handleResizeEnd () {
      this.$store.commit('getList')
    },
    handlePictureDragOver (e) {
      this.$store.commit('dragTrackOver', { e: e, vm: this })
    },
    handleClick (e, index) {
      let realE = e
      if (!e.target || e.target.className !== 'pic-clip') {
        realE = this.$refs['picture' + index][0]
      }
      this.$emit('click-picture', realE, index, this.trackIndex, 'pictureTrackList', 'pictureTab', 'picture')
    },
    handleMouseDown (e, index, isNeedTab) {
      // isNeedTab: 用于区分是否需要激活对应DRR - 在轨道拖拽操作中不必激活
      let realE = e
      if (!e.target || e.target.className !== 'pic-clip') {
        realE = this.$refs['picture' + index][0]
      }
      this.$emit('mousedown-picture', realE, index, this.trackIndex, 'picture', isNeedTab)
    }
  }
}
</script>
<style lang="stylus" scoped>
.pictureTrack
  height 30px
  video,
  .el-image
    width 100%
    height 100%
.pic-container
  position absolute
  display inline-block
  width 0px
  line-height 30px
  font-size 13px
  color #fff
.pic-clip
  display inline-block
  text-align center
  border-radius 5px
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
  height 30px
  cursor col-resize
  z-index 4
</style>
