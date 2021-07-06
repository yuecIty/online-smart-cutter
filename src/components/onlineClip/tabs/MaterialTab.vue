<template>
  <div class="material-tab">
    <div class="material-container">
      <Draggable
        :list="materialTabList"
        :sort="false"
        :group="{ name: 'media', pull: 'clone', put: false }"
        :clone="handleMediaClone"
        @start="handleMaterialAddBefore"
        @end="handleMaterialAdd"
      >
        <div
          v-for="(material, index) in materialTabList"
          :key="material.id + '' + material.startTime + material.endTime + index"
          class="lastest-info"
          @mouseover="mouseTarget = index"
          @mouseout="mouseTarget = null"
        >
          <el-image :src="material.cover"></el-image>
          <!-- <video
            crossOrigin="*"
            :src="material.playUrl"
            :poster="material.cover"
            :ref="'video' + index"
            muted
          ></video> -->
          <i
            class="el-icon-delete material-delete"
            :style="{
              display: mouseTarget === index ? 'block' : 'none'
            }"
            @click="handleMaterialDelete(index)"
          ></i>
          <i
            :style="{
              display: mouseTarget === index ? 'block' : 'none'
            }"
            class="el-icon-circle-plus-outline material-add"
            @click="handleIconAdd(material, index)"
          ></i>
          <div class="material-duration">
            <span>{{ getDuration(material.frameDuration) }}</span>
          </div>
          <el-tooltip :disabled="material.videoTitle.length < 14" placement="bottom-start" :content="material.videoTitle">
            <div class="material-title"><span>{{ material.videoTitle }}</span></div>
          </el-tooltip>
        </div>
      </Draggable>
    </div>
    <div class="methods-area">
      <div class="methods-button-group">
        <el-button class="methods-button" @click="$emit('show-material-dialog')">添加素材</el-button>
        <el-upload
          class="location-upload"
          accept=".mp4"
          ref="materialUpload"
          :action="uploadAction"
          :disabled="isUploading"
          :multiple="false"
          :show-file-list="false"
          :before-upload="judgeUploadType"
          :on-success="handleUploadSuccess"
        >
          <el-button class="methods-button" :disabled="isUploading">
            <span v-show="!isUploading">本地上传</span>
            <Loading v-show="isUploading" color="#26CB51" :type="2"></Loading>
          </el-button>
        </el-upload>
        <span class="message"> *本地上传功能开发中</span>
        <!-- <span class="message"> 本地仅支持上传MP4格式视频</span> -->
      </div>
      <!-- 本期不实现 -->
      <!-- <div class="methods-scan-way">
        <i class="el-icon-s-fold"></i>
        <i class="el-icon-menu"></i>
      </div> -->
    </div>
  </div>
</template>
<script>
import Draggable from 'vuedraggable'
import Loading from '../Loading'
import { formatDuration } from '@/components/onlineClip/global/functions'
import { mapState } from 'vuex'
export default {
  components: {
    Draggable,
    Loading
  },
  props: {
    editId: {
      type: Number,
      default: null
    }
  },
  data () {
    return {
      isLimit: false,
      mouseTarget: null,
      loadingImage: require('@/assets/material1004.png'),
      uploadAction: '',
      // 关闭接口
      // uploadAction: 'api/ccVideoProduction/uploadVideo.html'
    }
  },
  computed: {
    ...mapState({
      trackScale: state => state.trackScale,
      defaultMaterialHeight: state => state.defaultMaterialHeight,
      trackDuration: state => state.trackDuration,
      materialFileLastLength: state => state.materialFileLastLength,
      operationIndex: state => state.operationIndex,
      operationName: state => state.operationName,
      isMaterialUploading: state => state.isMaterialUploading,
      isEditMaterialUploading: state => state.isEditMaterialUploading,
      isCloseClip: state => state.isCloseClip,
      selected: state => state.selected,
      materialTabList: state => state.materialTabList,
      materialFileList: state => state.materialFileList,
      materialTrackList: state => state.materialTrackList,
      materialTrackWidth: state => state.materialTrackWidth
    }),
    isUploading: function () {
      return this.editId ? this.isEditMaterialUploading : this.isMaterialUploading
    }
  },
  watch: {
    materialFileList: function (val) {
      // 监听 - 文件列表 用于判断新增的本地文件应该加到哪个数组中

      if (val.length <= this.materialFileLastLength) {
        // 不是新增 不处理 但需记录文件数组长度
        this.$store.commit('updateValue', { name: 'materialFileLastLength', value: val.length })
        return true
      }

      const data = val[val.length - 1]
      if (this.isCloseClip) {
        // 选择本地上传后 有退出过剪辑页面后再进入当前页面
        if (!this.editId) {
          // 当前页面为新建剪辑页面
          this.$store.commit('updateArrayAdd', { name: 'materialTabList', value: data })
        } else {
          // 当前页面为编辑剪辑页面 - 上个页面退出前已进行数据处理
        }
        this.$store.commit('updateValue', { name: 'isCloseClip', value: false })
      } else {
        // 选择本地上传后 没有退出过剪辑 一直停留在当前页面
        this.$store.commit('updateArrayAdd', { name: 'materialTabList', value: data })
      }
      // 记录文件数组长度 用于下次的比对
      this.$store.commit('updateValue', { name: 'materialFileLastLength', value: val.length })
    },
    materialTabList: function (val) {
      // 已选素材变化时 需要检查是否有cover
      this.$nextTick(() => {
        this.getMaterialLoad(val)
      })
    },
    materialTrackList: function (val) {
      // 视频轨道素材发生变化时 需要更新trackDuration
      this.$nextTick(() => {
        const trackEndTime = val.length > 0 ? val[val.length - 1].trackEndTime : 0
        if (trackEndTime === undefined) {
          return true
        }
        this.judgeTrackDuration(trackEndTime)
      })
    }
  },
  methods: {
    handleMediaClone (e) {
      // 拖拽深拷贝
      return { ...e }
    },
    handleMaterialAddBefore (e) {
      // 进行轨道素材添加前的条件判断
      const duration = this.trackDuration
      const material = this.materialTabList[e.oldIndex]
      // 时长条件
      if (duration + material.frameDuration > 5400) {
        this.$message('添加后轨道素材将超过时长上限(1.5小时)，请进行剪删操作后再添加')
        this.isLimit = true
        return false
      }
      // 加载条件
      if (material.cover.indexOf('material1004') !== -1) {
        this.$message('素材加载中，暂不可用')
        this.isLimit = true
        return false
      }
    },
    handleMaterialAdd (e) {
      // 进行轨道素材添加
      if (e.from === e.to) {
        // 不允许同一列表的自我添加
        return false
      }
      if (this.isLimit) {
        // 若不符合轨道素材添加条件 删除自动添加的数据
        this.$store.commit('updateArrayDelete', { name: 'materialTrackList', index: e.newIndex, amount: 1 })
        this.isLimit = false
        return false
      }

      const targetIndex = e.newIndex
      const indexCount = this.materialTrackList.length - 1
      let materialTrackList = this.materialTrackList
      let material = this.materialTrackList[targetIndex]
      let target = ''

      const duration = material.frameDuration

      // 更新选择块duration属性及对应track宽度
      this.$store.commit('updateObjectAttribute', { name: 'selected', attr: 'duration', value: duration })
      this.$store.commit('updateValue', { name: 'materialTrackWidth', value: this.materialTrackWidth + duration * this.trackScale })

      if (targetIndex === indexCount) {
        // 添加在末尾 不涉及其他轨道块的重绘
        target = document.getElementById('clip' + targetIndex)
      } else {
        // 添加在其他位置 需对数据改变涉及的其他轨道块进行重绘
        for (let i = indexCount; i > targetIndex; i--) {
          let before = document.getElementById('clip' + (i - 1))
          let after = document.getElementById('clip' + i)
          // 更新显示样式
          after.style = `
            width: ${before.style.width};
            height: ${before.style.height};
            background-image: ${before.style.backgroundImage};
            background-size: auto 100%;
          `
          // 更新数据
          this.$store.commit('updateMateriaTime', { duration: duration, index: i, operator: 1 })
        }
        target = document.getElementById('clip' + targetIndex)
      }

      // 设置添加的轨道块样式
      target.style = `
        width: ${duration * this.trackScale}px;
        height: ${this.defaultMaterialHeight}px;
        background-image: url(${material.cover});
        background-size: auto 100%;
      `
      // 设置添加的轨道块数据
      const time = targetIndex ? materialTrackList[targetIndex - 1].trackEndTime : 0
      const value = {
        trackStartTime: time,
        trackEndTime: time + duration,
        startTime: material.startFrame,
        endTime: material.endFrame
      }
      for (let key in value) {
        this.$store.commit('updateArrayObjectAttr', { name: 'materialTrackList', index: targetIndex, attr: key, value: value[key] })
      }

      // 更新各时长及选中
      this.judgeTrackDuration(this.materialTrackList[indexCount].trackEndTime)
      this.$emit('selected-click', target, targetIndex, 'materialTrackList')

      // 若当前添加的为第一个 更新视频数据及绘制播放区域图片
      if (this.materialTrackList.length === 1) {
        this.$emit('video-data', material.playUrl, 0)
        this.$emit('video-cover', this.materialTrackList[0].startFrame)
      }
      // 更新转场
      // this.$store.commit('updateValue', { name: 'operationName', value: 'add' })
      // this.$store.commit('updateValue', { name: 'operationIndex', value: targetIndex })
    },
    handleMaterialDelete (index) {
      // 已选素材删除
      const target = this.materialTabList[index]
      // 判断是否在轨道素材中使用
      const onTrack = this.materialTrackList.find(item => {
        return item.coocaaMId === target.coocaaMId && item.startFrame === target.startFrame && item.endFrame === target.endFrame
      })
      if (onTrack) {
        this.$message({
          type: 'warning',
          message: '该素材已在轨道中使用，不可删除'
        })
        return false
      }
      // 区分是否为本地视频 本地视频coocaaVId为-1
      if (target.coocaaVId * 1 === -1) {
        const fileIndex = this.materialFileList.findIndex(item => {
          return item.fileId === target.fileId
        })
        // 本地视频需删除两个数组的对应数据
        this.$store.commit('updateArrayDelete', { name: 'materialTabList', index: index, amount: 1 })
        this.$store.commit('updateArrayDelete', { name: 'materialFileList', index: fileIndex, amount: 1 })
      } else {
        // 非本地视频只需删除tabs数组数据
        this.$store.commit('updateArrayDelete', { name: 'materialTabList', index: index, amount: 1 })
      }
    },
    handleIconAdd (material, index) {
      // 点击图标添加 - 添加至轨道素材
      const target = { ...material }
      let e = {}
      e.from = 0
      e.to = 1
      e.newIndex = this.materialTrackList.length
      e.oldIndex = index
      this.$store.commit('updateArrayAdd', { name: 'materialTrackList', value: target })
      this.$nextTick(() => {
        this.handleMaterialAddBefore(e)
        this.handleMaterialAdd(e)
      })
    },
    handleUploadSuccess (file) {
      // 文件上传结束 进行数据处理
      this.handleUploadCoverDraw(file.data)
    },
    handleUploadCoverDraw (data) {
      // 获取文件的显示封面及设置相关数据
      data.fileId = this.materialFileList.length
      let canvas = document.createElement('canvas')
      let video = document.createElement('video')
      video.setAttribute('crossOrigin', '*')
      video.src = data.playUrl
      video.currentTime = 2
      canvas.width = 170
      canvas.height = 100
      video.onloadeddata = () => {
        if (this.isUploading) {
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
          data.cover = canvas.toDataURL('image/jpeg')
          data.startTime = data.startFrame
          data.endTime = data.endFrame
          // 通过判断 添加对应id 进行上传
          this.$store.commit('updateArrayAdd', { name: 'materialFileList', value: data })
          if (!this.editId) {
            // 处理 新建-退出-没进页面 的情况
            this.$store.commit('updateArrayAdd', { name: 'materialTabNewList', value: data })
          }
          const name = this.editId ? 'isEditMaterialUploading' : 'isMaterialUploading'
          this.$store.commit('updateValue', { name: name, value: false })
        }
      }
    },
    judgeTrackDuration (endTime) {
      // 更新trackDuration及相关时长数据
      this.$store.commit('updateTracksDuration', { name: 'material', duration: endTime })
      this.$store.commit('updateValue', { name: 'trackDuration', value: endTime })
      if (this.trackDuration === 0) {
        this.$emit('update-date', 0, false)
      }
    },
    judgeUploadType (file) {
      // 进行文件上传前的判断
      // 格式条件
      if (file.type !== 'video/mp4') {
        this.$message({
          message: '仅支持上传MP4格式视频',
          type: 'warning'
        })
        return false
      }
      // 上传条件 - 已上传的视频不允许再上传
      const target = this.materialFileList.find(item => {
        return item.name === file.name
      })
      const name = file.name.split('.')[0]
      const editTarget = this.materialTabList.find(item => {
        return item.videoTitle === name
      })
      if (target || (this.editId && editTarget)) {
        this.$message({
          message: '已选素材中已有同名文件, 请勿重复上传',
          type: 'warning'
        })
        return false
      }
      // 开始上传文件 记录上传状态为true
      const attrName = this.editId ? 'isEditMaterialUploading' : 'isMaterialUploading'
      this.$store.commit('updateValue', { name: attrName, value: true })
      // 避免上次上传时关闭剪辑页面 且在剪辑页面外上传完毕 所导致的materialFileList变化未能在本组件内成功监听 进而导致的isCloseClip状态未在新页面重置问题
      this.$store.commit('updateValue', { name: 'isCloseClip', value: false })
    },
    getDuration (duration) {
      // 获取格式化后的时长字符串
      return formatDuration(duration)
    },
    getMaterialLoad (list) {
      // 获取各素材封面
      const black = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCABuAMgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AJVAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//Z'
      for (let i = 0; i < list.length; i++) {
        let cover = list[i].cover
        if (cover.indexOf('material1004') === -1) {
          // 若当前素材已获取封面 跳过
          continue
        }
        let canvas = document.createElement('canvas')
        let video = document.createElement('video')
        canvas.width = 200
        canvas.height = 110
        video.setAttribute('crossOrigin', '*')
        video.src = list[i].playUrl
        video.currentTime = 1
        video.oncanplay = () => {
          // 异步 需判断结果与请求是否对应
          if (!list[i]) {
            return false
          }
          if (video.src.indexOf(list[i].playUrl) === -1 || list[i].cover.indexOf('material1004') === -1) {
            return false
          }
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
          const dataURL = canvas.toDataURL('image/jpeg')
          // 若获取到全黑截图 不存(全黑一般为视频未加载好)
          const realCover = dataURL === black ? this.loadingImage : dataURL
          this.$store.commit('updateArrayObjectAttr', { name: 'materialTabList', index: i, attr: 'cover', value: realCover })
          // 清空变量及监听
          video.oncanplay = null
          video = null
          canvas = null
        }
      }
    }
  },
  mounted () {
    this.getMaterialLoad(this.materialTabList)
  },
  beforeDestroy () {
    // 设置页面退出标识
    this.$store.commit('updateValue', { name: 'isCloseClip', value: true })
    if (this.editId && this.isEditMaterialUploading) {
      // 编辑退出 且文件上传中 取消上传 更新相关状态
      this.$refs.materialUpload.abort()
      this.$store.commit('updateValue', { name: 'isEditMaterialUploading', value: false })
    }
  }
}
</script>
<style lang="stylus" scoped>
.material-tab
  height 100%
.material-container
  height calc(100% - 35px)
  overflow-y scroll
.lastest-info
  display inline-block
  position relative
  margin 0px 5px 5px
  width 170px
  border 1px solid #888888
  border-radius 3px
  transition all .3s
  &:hover
    border-color #26CB51
  video,
  .el-image
    width 100%
    height 100px
    border-radius 3px 3px 0px 0px
    object-fit fill
    &:focus
      width 20px
.material-add, .material-delete
  position absolute
  top 3px
  font-size 17px
  color #fff
.material-add
  right 2px
  font-weight 600
  color #26CB51
  cursor pointer
.material-delete
  left 2px
  cursor pointer
  &:hover,
  &:focus
    color red !important
.material-duration
  position absolute
  top 80px
  right 2px
  width 55px
  text-align center
  font-size 12px
  color #C7D3D4
  background #4A4A4AB8
  border-radius 2px
.material-title
  padding 0px 2px 4px
  width 100%
  font-size 12px
  color #888
  white-space nowrap
  overflow hidden
  text-overflow ellipsis
  cursor default
.methods-area
  position absolute
  bottom 5px
  width 100%
.methods-button-group
  display inline-block
  margin 5px 2px 0px
.methods-button
  width 100px
  height 30px
  line-height 5px
  font-size 13px
  color #888
  border 1px solid #777
  background #000
  &:focus
    background #000
  &:hover
    color #26CB51
    border-color #26CB51
    background #000
.location-upload
  display inline-block
  margin-left 10px
.methods-scan-way
  position absolute
  top 25px
  right 10px
  font-size 20px
  i
    margin-left 20px
.drag-ghost
  margin 0px
  height 40px
  video,
  .el-image
    height 40px !important
  .material-duration
    top 24px
</style>
