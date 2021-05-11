<template>
<!-- drr：drag resize rotate -->
  <div>
    <div v-show="isEdit" ref="drrInput" class="drr-input" @mousedown="handleDrrHandler">
      <el-input
        v-model="editText"
        ref="input"
        type="textarea"
        resize="none"
        class="input-style"
        @blur="handleDrrTextEditBlur"
        @keyup.enter.native="handleDrrTextEditEnd"
      ></el-input>
    </div>
    <div
      v-for="(item, index) in trackList"
      :key="item.id + '' + index"
      class="resizable-container"
    >
      <div
        class="draggable-container"
        :style="{
          transform: isSubmit ? 'scale(' + (640 / originalWidth) + ')' : 'scale(' + proportion + ')'
        }"
      >
        <DraggableResizable
          v-if="handleShow(index)"
          class="resizable-style"
          class-name-handle="resizable-handle"
          ref="resizable"
          :w="item.width"
          :h="item.height"
          :angle="item.whirl"
          :x="item.nowXAxis"
          :y="item.nowYAxis"
          :minw="1"
          :minh="1"
          :handles="keyCode === 16 ? ['nw', 'ne', 'sw', 'se'] : ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se']"
          :active="!isSubmit && activeName === 'text' && selected.trackIndex === trackIndex && selected.index === index"
          :rotatable="!isSubmit"
          :draggable="!isSubmit"
          :resizable="!isSubmit"
          @rotating="handleRotating"
          @resizing="handleResizing"
          @dragging="handleDragging"
          @activated="handleActive(index)"
          @dragstop="handleDragStop"
          @resizestop="handleResizeStop"
          @dblclick.native="handleDrrTextEdit(item, index)"
        >
          <div v-if="!isEdit" class="drr-target-container">
            <span
              ref="drrTarget"
              class="drr-target"
              :style="{
                fontFamily: item.fontFile,
                fontSize: item.fontSize + 'px',
                color: item.fontColor,
                fontWeight: item.bold ? item.fontWeight : 400,
                fontStyle: item.italic ? item.fontStyle : 'normal',
                letterSpacing: item.wordSpacing + 'px',
                lineHeight: item.lineSpacing,
                border: item.frame ? item.border : 'none',
                textAlign: item.alignment,
                textShadow: item.shadowY ? item.textShadow : 'none',
                textDecoration: item.underLine ? item.textDecoration : 'none',
                opacity: item.transparency,
                webkitTextStroke: item.borderW ? item.webkitTextStroke : '0px'
              }"
            >{{ item.text }}</span>
          </div>
        </DraggableResizable>
      </div>
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
    isTextEdit: { // 某个轨道的编辑状态
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
  data () {
    return {
      editText: '',
      isEdit: false,
      isDivRange: false
    }
  },
  computed: {
    ...mapState({
      storeTrackIndex: state => state.trackIndex,
      proportion: state => state.proportion,
      originalWidth: state => state.originalWidth,
      activeName: state => state.activeName,
      dragPlayingName: state => state.dragPlayingName,
      selected: state => state.selected,
      playingText: state => state.playingText,
      playingTextIndex: state => state.playingTextIndex
    })
  },
  watch: {
    videoPlay: function (val) {
      if (val && this.isEdit) {
        // 若视频播放且有drr为编辑状态 需退出
        this.handleDrrTextEditEnd()
      }
    }
  },
  methods: {
    handleShow (index) {
      // 判断是否显示某drr
      if (this.isSubmit) {
        // 处于保存/提交剪辑页面 index对上就显示
        return this.submitPlayingIndex[this.trackIndex] === index
      } else {
        // 处于在线剪辑页面 还需判断dragPlayingName
        const judgeOne = this.dragPlayingName !== 'text' || (this.dragPlayingName === 'text' && this.storeTrackIndex !== this.trackIndex)
        return judgeOne && this.playingTextIndex[this.trackIndex] === index
      }
    },
    handleRotating (angle) {
      if (this.videoPlay) {
        this.$emit('video-pause')
      }
      if (this.isEdit) {
        this.handleDrrTextEditEnd()
      }
      this.$store.commit('drrRotating', angle)
    },
    handleResizing (left, top, width, height) {
      if (this.videoPlay) {
        this.$emit('video-pause')
      }
      if (this.isEdit) {
        this.handleDrrTextEditEnd()
      }
      const rect = {
        left: left,
        top: top,
        width: width,
        height: height
      }
      this.$store.commit('drrResizing', { keyCode: this.keyCode, rect: rect, playingName: 'playingText', vm: this })
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
        activeTarget: 'text',
        list: 'textTrackList',
        playingName: 'playingText',
        vm: this
      })
      const e = document.querySelector('#textTrack' + this.trackIndex).querySelector('#text' + index)
      // 如果是来自mousedown的请求 就不必再select一次
      if (!isFromMouseDown) {
        this.$store.commit('trackBlockSelect', { e: e, index: index, trackIndex: this.trackIndex, list: 'textTrackList' })
      }
    },
    handleDragStop (left, top) {
      this.$store.commit('drrDragStop', { left: left, top: top, playingName: 'playingText', vm: this })
    },
    handleResizeStop (left, top, width, height) {
      this.$store.commit('drrResizeStop', { left: left, top: top, width: width, height: height })
    },
    handleDrrHandler () {
      if (!this.isEdit || this.isSubmit) {
        return false
      }
      this.isDivRange = true
      this.$store.commit('drrActive', { activeTarget: 'text', list: 'textTrackList', playingName: 'playingText', vm: this })
    },
    handleDrrTextEdit (item, index) {
      // 唤醒drr的编辑
      if (this.isSubmit) {
        // 若为保存/提交剪辑页面 不允许唤醒
        return false
      }

      this.isEdit = true
      // 保存处于编辑状态的index
      this.$store.commit('updateNumberOrString', { name: 'textEditIndex', value: index })
      // 编辑的文本与显示文本同步
      this.editText = item.text
      // 编辑文本样式与显示文本样式同步
      const inputStyle = this.$refs.drrInput.style
      const style = this.$refs.input.$el.firstChild.style
      inputStyle.width = item.width + 'px'
      inputStyle.height = item.height + 'px'
      inputStyle.transform = 'translate(' + item.nowXAxis + 'px, ' + item.nowYAxis + 'px)'
      style.width = item.width + 'px'
      style.height = item.height + 'px'
      style.fontSize = item.fontSize + 'px'
      style.fontFamily = item.fontFile
      style.color = item.fontColor
      style.letterSpacing = item.wordSpacing + 'px'
      style.lineHeight = item.lineSpacing
      style.opacity = item.transpancy
      setTimeout(() => {
        // 需等待一会 保证input加载完毕 已有focus事件
        this.$refs.input.focus()
      }, 50)
      // 传出告知其他组件 有drr处于编辑状态
      this.$emit('text-edit', true)
    },
    handleDrrTextEditBlur () {
      // 编辑输入框失焦时
      if (this.isDivRange) {
        // 若还处于编辑块内 保留焦点与激活状态
        this.isDivRange = false
        this.$refs.input.focus()
        this.$store.commit('drrActive', { activeTarget: 'text', list: 'textTrackList', playingName: 'playingText', vm: this })
        return false
      }
      // 若处于编辑块外 退出其编辑状态
      this.handleDrrTextEditEnd()
    },
    handleDrrTextEditEnd () {
      // 退出编辑状态及对应处理
      this.isEdit = false
      // 传出告知其他组件 drr编辑已关闭
      this.$emit('text-edit', false)
      // 保存编辑文本
      this.$store.commit('drrTextChange', { text: this.editText, trackIndex: this.trackIndex })
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
.draggable-container
  position relative
  transform-origin 0 0 0
  z-index 2
.drr-input
  position absolute
  z-index 3
.input-style
  >>>.el-textarea__inner
    padding 0px
    border 0px
    background transparent
    overflow hidden
    caret-color #26cb51
.drr-target-container
  width 100%
  height 100%
.drr-target
  display inline-block
  width 100%
  height 100%
</style>
