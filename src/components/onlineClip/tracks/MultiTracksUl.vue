<template>
  <div>
    <ul class="ul-style">
      <li @click="handleTrackAdd">
        <i class="el-icon-plus"></i>
        <span> 添加{{ text }}轨</span>
      </li>
      <li @click="handleTrackDelete">
        <i class="el-icon-minus"></i>
        <span> 删除{{ text }}轨</span>
      </li>
      <li @click="handleTrackCopy">
        <i class="el-icon-copy-document"></i>
        <span> 复制当前轨道</span>
      </li>
    </ul>
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  props: {
    index: {
      type: Number,
      default: null
    },
    iconWidth: {
      type: Number,
      default: null
    },
    text: {
      type: String,
      default: null
    },
    name: {
      type: String,
      default: null
    }
  },
  computed: {
    ...mapState({
      pictureTrackList: state => state.pictureTrackList,
      textTrackList: state => state.textTrackList
    }),
    listName: function () {
      return this.name + 'TrackList'
    }
  },
  methods: {
    handleTrackAdd () {
      // 多轨道 - 添加空白轨道
      if (this.judgeTrackSubLimit(5)) {
        this.$store.commit('trackAdd', { name: this.name, index: this.index, list: this.listName, vm: this })
      }
    },
    handleTrackDelete () {
      // 多轨道 - 删除当前轨道
      if (this[this.listName].length === 1) {
        this.$message({
          type: 'warning',
          message: '删除失败，该类型轨道必须存在一条'
        })
        return false
      }
      this.$store.commit('trackDelete', { name: this.name, index: this.index, list: this.listName, vm: this })
    },
    handleTrackCopy () {
      // 多轨道 - 复制当前轨道
      if (this.judgeTrackSubLimit(5)) {
        this.$store.commit('trackCopy', { name: this.name, index: this.index, list: this.listName, vm: this })
      }
    },
    judgeTrackSubLimit (amount) {
      if (this[this.listName].length === amount) {
        this.$message({
          type: 'warning',
          message: '添加失败，该类型轨道条数已达上限'
        })
        return false
      }
      return true
    }
  }
}
</script>
<style lang="stylus" scoped>
.ul-style
  margin 0px
  padding 10px
  width max-content
  text-align right
  font-size 14px
  i:not(.el-icon-copy-document)
    width 28px
    text-align left
  li
    &:hover
      color #409eff
      cursor pointer
</style>
