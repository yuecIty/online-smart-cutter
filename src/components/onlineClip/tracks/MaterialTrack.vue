<template>
  <div>
    <Draggable
      group="media"
      class="drag-target"
      ghost-class="drag-ghost"
      :list="materialTrackList"
      :animation="300"
      @start="handleSelectedStart"
      @update="handleSelectedSort"
    >
      <div
        v-for="(item, index) in materialTrackList"
        :key="index"
        class="track-container"
      >
        <div
          class="video-images"
          :id="'clip' + index"
          :ref="'clip' + index"
          @click="$emit('selected-click', $event, index, 'materialTrackList')"
        ></div>
      </div>
    </Draggable>
  </div>
</template>
<script>
import Draggable from 'vuedraggable'
import { mapState } from 'vuex'
export default {
  components: {
    Draggable
  },
  props: {
    videoPlay: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      trackContainer: null
    }
  },
  computed: {
    ...mapState({
      trackScale: state => state.trackScale,
      operationIndex: state => state.operationIndex,
      operationNewIndex: state => state.operationNewIndex,
      operationName: state => state.operationName,
      materialTrackList: state => state.materialTrackList,
      materialTrackWidth: state => state.materialTrackWidth
    })
  },
  watch: {
    materialTrackWidth: function (val) {
      this.trackContainer.style.width = val + 'px'
    }
  },
  methods: {
    handleSelectedStart (e) {
      // 开始进行轨道块操作时 先选中对应轨道块
      const index = 'clip' + e.oldIndex
      this.$emit('selected-click', this.$refs[index][0], e.oldIndex, 'materialTrackList')
    },
    handleSelectedSort (e) {
      // 轨道块拖拽排序移动
      if (this.videoPlay) {
        this.$emit('video-pause')
      }

      // 获取移动前后对应index
      const targetIndex = e.newIndex
      const originalIndex = e.oldIndex

      let moveWidth = 0
      let target = document.getElementById('clip' + targetIndex)
      const originalTarget = document.getElementById('clip' + originalIndex)
      const temp = {
        width: originalTarget.style.width,
        height: originalTarget.style.height,
        backgroundImage: originalTarget.style.backgroundImage
      }
      const moveTrackDuration = this.getDurationByWidth(originalTarget.offsetWidth)

      if (targetIndex > originalIndex) {
        // 后移
        // 所涉及需更改的数据
        for (let i = originalIndex; i < targetIndex; i++) {
          let before = document.getElementById('clip' + (i + 1))
          let after = document.getElementById('clip' + i)
          // 累计选择块移动距离
          moveWidth += before.offsetWidth
          // 更新显示样式
          this.updateStyle(before, after)
          // 更新数据
          this.$store.commit('updateMateriaTime', { duration: moveTrackDuration, index: i, operator: 0 })
        }
        // 更新选择块数据
        const tempWidth = this.getDurationByWidth(moveWidth)
        this.$store.commit('updateMateriaTime', { duration: tempWidth, index: targetIndex, operator: 1 })
      } else {
        // 前移
        // 所涉及需更改的数据
        for (let j = originalIndex; j > targetIndex; j--) {
          let before2 = document.getElementById('clip' + (j - 1))
          let after2 = document.getElementById('clip' + j)
          // 累计选择块移动距离
          moveWidth += before2.offsetWidth
          // 更新显示样式
          this.updateStyle(before2, after2)
          // 更新数据
          this.$store.commit('updateMateriaTime', { duration: moveTrackDuration, index: j, operator: 1 })
        }
        // 更新选择块数据
        const tempWidth = this.getDurationByWidth(moveWidth)
        this.$store.commit('updateMateriaTime', { duration: tempWidth, index: targetIndex, operator: 0 })
      }
      // 更新选择块显示样式
      target.style.width = temp.width
      target.style.height = temp.height
      target.style.backgroundImage = temp.backgroundImage
      target.style.backgroundSize = 'auto 100%'
      // 更新转场
      this.$store.commit('updateValue', { name: 'operationName', value: 'sort' })
      // this.$store.commit('updateValue', { name: 'operationIndex', value: originalIndex })
      // this.$store.commit('updateValue', { name: 'operationNewIndex', value: targetIndex })
      // 更新选择块数据
      this.$emit('selected-click', target, targetIndex, 'materialTrackList')
    },
    updateStyle (before, after) {
      after.style.width = before.style.width
      after.style.height = before.style.height
      after.style.backgroundImage = before.style.backgroundImage
      after.style.backgroundSize = 'auto 100%'
    },
    getDurationByWidth (width) {
      // 获取时长 - 根据所设置的宽度与时长比例计算
      return width / this.trackScale
    }
  },
  mounted () {
    this.trackContainer = document.querySelector('.drag-target')
  }
}
</script>
<style lang="stylus" scoped>
.drag-target
  width 100%
  height 55px
.drag-ghost
  margin 0px
  height 40px
  video
    height 40px !important
.track-container
  display inline-block
.video-images
  display inline-block
  border-radius 5px
  cursor pointer
</style>
