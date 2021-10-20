<template>
<!-- drr：drag resize rotate -->
  <div>
    <div
      v-for="(item, index) in trackList"
      :key="item.id + '' + index"
      class="resizable-container"
    >
      <DraggableResizable
        v-if="handleShow(index)"
        class="resizable-style"
        class-name-handle="resizable-handle"
        ref="resizable"
        :w="isSubmit ? item.width * scale.width : item.width"
        :h="isSubmit ? item.height * scale.height : item.height"
        :angle="item.whirl"
        :x="isSubmit ? item.nowXAxis * scale.width : item.nowXAxis"
        :y="isSubmit ? item.nowYAxis * scale.height : item.nowYAxis"
        :minw="1"
        :minh="1"
        :handles="keyCode === 16 ? ['nw', 'ne', 'sw', 'se'] : ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']"
        :active="!isSubmit && activeName === 'picture' && selected.trackIndex === trackIndex && selected.index === index"
        :rotatable="!isSubmit"
        :draggable="!isSubmit"
        :resizable="!isSubmit"
        @rotating="handleRotating"
        @resizing="handleResizing"
        @dragging="handleDragging"
        @activated="handleActive(index)"
        @dragstop="handleDragStop"
        @resizestop="handleResizeStop"
      >
        <video
          v-if="item.fileType === 'video'"
          ref="drrTarget"
          class="picture-video"
          crossOrigin="*"
          muted
          :src="item.fileUrl"
          @mousedown="handleResizeClick(index)"
        ></video>
        <el-image
          v-if="item.fileType !== 'video'"
          ref="drrTarget"
          class="picture-image"
          :src="item.fileUrl"
          @mousedown="handleResizeClick(index)"
        ></el-image>
      </DraggableResizable>
    </div>
  </div>
</template>
<script>
import DraggableResizable from 'vue-drr'
import { mapState } from 'vuex'
export default {
  components: {
    DraggableResizable
  },
  props: {
    keyCode: {
      type: Number,
      default: null
    },
    trackIndex: {
      type: Number,
      default: 0
    },
    videoPlay: {
      type: Boolean,
      default: false
    },
    isTextEdit: {
      type: Boolean,
      default: false
    },
    isSubmit: {
      type: Boolean,
      default: false
    },
    trackList: {
      type: Array,
      default: function () {}
    },
    submitPlaying: {
      type: Array,
      default: function () {}
    },
    submitPlayingIndex: {
      type: Array,
      default: function () {}
    },
    scale: { // 保存/提交剪辑页面播放区域与在线剪辑播放区域的比例
      type: Object,
      default: function () {}
    }
  },
  computed: {
    ...mapState({
      playingPicture: state => state.playingPicture,
      playingPictureIndex: state => state.playingPictureIndex,
      activeName: state => state.activeName,
      selected: state => state.selected,
      dragPlayingName: state => state.dragPlayingName,
      storeTrackIndex: state => state.trackIndex
    })
  },
  watch: {
    playingPictureIndex: function (val) {
      if (val !== -1 && !this.isSubmit) {
        this.$nextTick(() => {
          const realTarget = this.$refs.drrTarget ? this.$refs.drrTarget[0] : null
          if (!realTarget) {
            return false
          }
          const targetStyle = realTarget.$el ? realTarget.$el.style : realTarget.style
          targetStyle.opacity = this.playingPicture[this.trackIndex].transparency
          targetStyle.transform = this.playingPicture[this.trackIndex].transform ? this.playingPicture[this.trackIndex].transform : ''
        })
      }
    },
    submitPlayingIndex: function (val) {
      if (val !== -1 && this.isSubmit) {
        this.$nextTick(() => {
          const realTarget = this.$refs.drrTarget ? this.$refs.drrTarget[0] : null
          if (!realTarget) {
            return false
          }
          const targetStyle = realTarget.$el ? realTarget.$el.style : realTarget.style
          targetStyle.opacity = this.submitPlaying[this.trackIndex].transparency
          targetStyle.transform = this.submitPlaying[this.trackIndex].transform ? this.submitPlaying[this.trackIndex].transform : ''
        })
      }
    }
  },
  methods: {
    handleShow (index) {
      if (this.isSubmit) {
        return this.submitPlayingIndex[this.trackIndex] === index
      } else {
        const judgeOne = this.dragPlayingName !== 'pixture' || (this.dragPlayingName === 'pixture' && this.storeTrackIndex !== this.trackIndex)
        return judgeOne && this.playingPictureIndex[this.trackIndex] === index
      }
    },
    handleRotating (angle) {
      if (this.videoPlay) {
        this.$emit('video-pause')
      }
      this.$store.commit('drrRotating', angle)
    },
    handleResizing (left, top, width, height) {
      if (this.videoPlay) {
        this.$emit('video-pause')
      }
      const rect = {
        left: left,
        top: top,
        width: width,
        height: height
      }
      this.$store.commit('drrResizing', { keyCode: this.keyCode, rect: rect, playingName: 'playingPicture', vm: this })
    },
    handleDragging () {
      if (this.videoPlay) {
        this.$emit('video-pause')
      }
    },
    handleActive (index, isFromMouseDown) {
      if (this.isSubmit) {
        // 若处于保存/提交剪辑页面 并不允许激活
        return false
      }
      if (this.isTextEdit) {
        // 若某轨道的文字仍处于编辑状态 将其退出
        this.$emit('stop-edit', this.selected.trackIndex)
      }
      this.$store.commit('drrActive', {
        activeTarget: 'picture',
        list: 'pictureTrackList',
        playingName: 'playingPicture',
        vm: this
      })
      const e = document.querySelector('#pictureTrack' + this.trackIndex).querySelector('#picture' + index)
      // 如果是来自mousedown的请求 就不必再select一次
      if (!isFromMouseDown) {
        this.$store.commit('trackBlockSelect', { e: e, index: index, trackIndex: this.trackIndex, list: 'pictureTrackList' })
      }
    },
    handleDragStop (left, top) {
      this.$store.commit('drrDragStop', { left: left, top: top, playingName: 'playingPicture', vm: this })
    },
    handleResizeStop (left, top, width, height) {
      this.$store.commit('drrResizeStop', { left: left, top: top, width: width, height: height })
    },
    handleResizeClick () {
      // const target = this.$refs.pictureTrack.$refs['picture' + index][0]
      // this.onlineTab = 'pictureTab'
      // this.$store.dispatch('setTrackBlockSelect', { e: target, index: index, list: 'pictureTrackList', vm: this })
    }
  }
}
</script>
<style lang="stylus" scoped>
.resizable-container
  position absolute
  top 0px
  width 100%
  height 100%
  overflow hidden
.resizable-style
  position absolute
  z-index 2
  .el-image
  video
    width inherit
    height inherit
.picture-video
  object-fit fill
</style>
