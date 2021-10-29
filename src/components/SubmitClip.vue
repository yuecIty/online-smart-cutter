<template>
  <div class="submit-dialog">
    <el-dialog
      append-to-body
      title="提交剪辑"
      :close-on-click-modal="false"
      :visible.sync="isSaveOrSubmit"
      :before-close="handleDialogClose"
    >
      <!-- 播放区域 -->
      <div class="submit-video-container">
        <div v-loading="isVideoLoading" element-loading-background="rgba(0, 0, 0, 0.5)" class="video-frame">
          <!-- 播放的视频 -->
          <video
            class="submit-video"
            ref="submitVideo"
            preload="auto"
            crossOrigin="*"
            style="display: none"
            :src="videoSrc"
            @timeupdate="handleVideoPlaying"
            @play="drawCanvasVideo"
            @pause="stopCanvasVideo"
            @seeking="isVideoLoading=true"
            @seeked="drawCanvasCover"
          ></video>
          <!-- <video
            class="submit-video"
            ref="videoTransition"
            preload="auto"
            crossOrigin="*"
            style="display: none"
            :src="playingTransition ? playingTransition.transitionMaterialUrl : ''"
          ></video> -->
          <!-- 实际的页面视频显示 -->
          <canvas
            id="canvasVideo"
            ref="canvasVideo"
            class="canvas-video"
          ></canvas>
        </div>
        <!-- drr区域 -->
        <!-- 先定义的在下层 -->
        <PictureDrr
          v-for="(item, index) in reversePictureList"
          :key="'pictureDrr' + getReverseIndex(index, reversePictureList.length)"
          ref="pictureDrr"
          class="resizable-container"
          :track-index="getReverseIndex(index, reversePictureList.length)"
          :track-list="item"
          :is-submit="true"
          :scale="{
            width: widthScale,
            height: heightScale
          }"
          :submit-playing="playingPicture"
          :submit-playing-index="playingPictureIndex"
        ></PictureDrr>
        <TextDrr
          v-for="(item, index) in reverseTextList"
          :key="'textDrr' + getReverseIndex(index, reverseTextList.length)"
          ref="textDrr"
          class="resizable-container"
          :id="'textDrr' + getReverseIndex(index, reverseTextList.length)"
          :track-index="index"
          :track-list="item"
          :is-submit="true"
          :scale="{
            width: widthScale,
            height: heightScale
          }"
          :submit-playing="playingText"
          :submit-playing-index="playingTextIndex"
        ></TextDrr>
        <!-- 播放器控制条 -->
        <VideoControls
          :video-play="videoPlay"
          :track-duration="trackDuration"
          :track-current-time="trackCurrentTime"
          @video-play="handleVideoPlay"
          @video-pause="handleVideoPause"
          @slider-change="handleSliderChange"
        ></VideoControls>
      </div>
      <!-- 保存按钮 -->
      <div class="submit-button-group">
        <!-- 根据传值动态显示为保存 / 提交 剪辑 -->
        <el-button v-loading="loadingSave" type="primary" @click="handleSubmitValid">确认提交</el-button>
        <el-button type="info" @click="handleDialogClose">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import PictureDrr from './drrContainers/PictureDrr'
import TextDrr from './drrContainers/TextDrr'
import VideoControls from './VideoControls'
// import Various from './global/various'
import { formatDuration } from '@/components/global/functions'
import { mapState } from 'vuex'
export default {
  components: {
    PictureDrr,
    TextDrr,
    VideoControls
  },
  props: {
    isSaveOrSubmit: {
      type: Boolean,
      default: false
    },
    videoFrame: {
      type: Object,
      default: function () {}
    }
  },
  data () {
    return {
      isVideoLoading: false,
      videoSrc: '',
      submitVideo: undefined,
      currentTime: 0,
      lastPlayedMaterial: {},
      playingMaterial: {},
      playingPicture: [],
      playingText: [],
      playingTransition: {},
      playingPictureIndex: [],
      playingTextIndex: [],
      videoPlay: false,
      trackCurrentTime: 0,
      trackCurrentTimeString: '00:00:00',
      trackDuration: 0,
      mediaImageUploadUrl: '',
      videoInfo: {
        videoTitle: '',
        duration: 0,
        firstVideoH: 0,
        firstVideoV: 0
      },
      loadingSave: false,
      realSelectedList: [],
      realAddedList: [],
      realPictureList: [],
      realTextList: [],
      // realTransitionList: Various.transitionList,
      reversePictureList: [],
      reverseTextList: [],
      isEnd: false,
      tracks: [
        {
          target: 'playingMaterial',
          list: 'realSelectedList'
        },
        {
          target: 'playingPicture',
          list: 'realPictureList'
        },
        {
          target: 'playingText',
          list: 'realTextList'
        }
        // {
        //   target: 'playingTransition',
        //   list: 'realTransitionList'
        // }
      ],
      canvasWidth: 100,
      canvasVideo: null,
      canvasTimer: null,
      widthScale: 0,
      heightScale: 0,
      oldPictureIndex: null
    }
  },
  computed: {
    ...mapState({
      materialTabList: state => state.materialTabList,
      materialTrackList: state => state.materialTrackList,
      pictureTrackList: state => state.pictureTrackList,
      textTrackList: state => state.textTrackList
    })
  },
  watch: {
    materialTrackList: function (val) {
      if (!val) {
        this.$message({
          type: 'error',
          message: '未获取到轨道素材信息，请重新保存或提交'
        })
        this.$emit('submit-close')
      }
    },
    playingPicture: function (val) {
      // 监听 - 当前是否有视频贴图需要播放
      if (this.oldPictureIndex === this.playingPictureIndex[0]) {
        // 避免视频贴图的卡顿以及不同视频贴图切换时所导致的骤停报错问题
        return true
      }
      this.oldPictureIndex = this.playingPictureIndex[0]
      if (val[0] && val[0].fileType === 'video') {
        if (this.videoPlay) {
          this.playVideoPicture(val[0], true)
        } else {
          this.playVideoPicture(val[0], false)
        }
      }
    }
  },
  methods: {
    handleDialogClose () {
      this.$emit('submit-close')
    },
    handleVideoPlayOrPause () {
      // 处理播放区域的播放/暂停
      if (this.videoPlay) {
        this.handleVideoPause()
      } else {
        this.handleVideoPlay()
      }
    },
    handleVideoPlaying () {
      // 监听 - 视频播放
      if (!this.videoPlay) {
        return false
      }
      if (this.trackCurrentTime >= this.trackDuration) {
        // 播放至末尾 需跳回开头
        this.trackCurrentTime = 0
        this.isEnd = true
      }
      if (!this.videoInfo.firstVideoH && this.videoSrc === this.realSelectedList[0].playUrl) {
        // 剪辑服务以第一个视频分辨率生成视频 故需要获取第一个视频的分辨率
        this.videoInfo.firstVideoH = this.submitVideo.videoWidth
        this.videoInfo.firstVideoV = this.submitVideo.videoHeight
      }
      if (this.submitVideo.currentTime < this.playingMaterial.startTime) {
        // 纠正currentTime
        this.submitVideo.currentTime = this.playingMaterial.startTime
      }
      // 获得当前的time
      this.trackCurrentTime = this.submitVideo.currentTime + this.playingMaterial.trackStartTime - this.playingMaterial.startTime
      this.trackCurrentTimeString = formatDuration(this.trackCurrentTime)
      if (this.trackCurrentTime >= this.trackDuration) {
        // 播放至末尾 需跳回开头
        this.trackCurrentTime = 0
        this.isEnd = true
      }
      // 获得playing-及设置对应播放地址
      this.getPlayingMaterial()
      this.handleVideoChange()
    },
    playVideoPicture (picture, isNeedPlay) {
      // 播放视频贴图
      this.$nextTick(() => {
        let videoPicture = this.$refs.pictureDrr[0].$refs.drrTarget[0]
        videoPicture.currentTime = this.trackCurrentTime - picture.trackStartTime
        // 设置drr的各项数值进行显示
        this.getDrrElement('playingPicture', 'pictureDrr')
        // 需要播放视频贴图
        if (isNeedPlay) {
          setTimeout(() => {
            // 避免异步函数在不允许的条件执行 - 非视频播放时不允许贴图播放
            if (this.videoPlay) {
              videoPicture.play()
            }
          }, 150)
        }
      })
    },
    handleVideoPlay () {
      // 视频区域播放
      setTimeout(() => {
        // 需计时等待一会 避免立即播放/暂停所导致的播放失败及控制台报错
        // 视频轨道播放
        this.submitVideo.currentTime = this.currentTime
        this.submitVideo.play()
        this.videoPlay = true
        // 转场视频播放
        // if (this.playingTransition && this.playingTransition.transitionMaterialUrl) {
        //   let videoTransition = this.$refs.videoTransition
        //   videoTransition.palybackRate = this.playingTransition.palybackRate
        //   videoTransition.currentTime = this.trackCurrentTime - this.playingTransition.trackStartTime
        //   videoTransition.play()
        // }
        const drrTarget = this.$refs.pictureDrr[0].$refs.drrTarget ? this.$refs.pictureDrr[0].$refs.drrTarget[0] : null
        if (drrTarget && this.playingPicture[0].fileType === 'video') {
          const duration = this.trackCurrentTime - this.playingPicture[0].trackStartTime
          if (!isNaN(duration)) {
            // 若存在需要播放的视频贴图 播放
            drrTarget.currentTime = this.trackCurrentTime - this.playingPicture[0].trackStartTime
            drrTarget.play()
          }
        }
      }, 150)
    },
    handleVideoPause () {
      // 播放区域暂停
      // 转场视频暂停
      // if (this.playingTransition && this.playingTransition.transitionMaterialUrl) {
      //   this.$refs.videoTransition.pause()
      // }
      // 视频轨道暂停
      this.videoPlay = false
      this.submitVideo.pause()
      const drrTarget = this.$refs.pictureDrr[0].$refs.drrTarget ? this.$refs.pictureDrr[0].$refs.drrTarget[0] : null
      if (drrTarget && this.playingPicture[0].fileType === 'video') {
        // 避免视频贴图播放时暂停后的无法再次播放
        this.oldPictureIndex = null
        drrTarget.pause()
      }
    },
    handleVideoChange () {
      // 设置播放地址
      const newUrl = this.playingMaterial.playUrl
      const oldUrl = this.lastPlayedMaterial.playUrl
      const newTime = this.playingMaterial.trackStartTime
      const oldTime = this.lastPlayedMaterial.trackStartTime
      const current = this.playingMaterial.startTime + this.trackCurrentTime - this.playingMaterial.trackStartTime
      this.currentTime = current
      // 暂停中
      if (!this.videoPlay) {
        this.videoSrc = this.playingMaterial.playUrl
        this.submitVideo.currentTime = current
        return 1
      }
      // 播放中 需要更换视频源
      if (newUrl !== oldUrl) {
        this.videoSrc = this.playingMaterial.playUrl
        this.submitVideo.src = this.playingMaterial.playUrl
        this.submitVideo.currentTime = current
        this.submitVideo.pause()
        setTimeout(() => {
          this.submitVideo.play()
        }, 150)
      }
      // 播放中 无需更换视频源
      if (newUrl === oldUrl && newTime !== oldTime) {
        this.submitVideo.currentTime = current
      }
      // 智能编辑生成作品 实际视频长度与轨道长度不符 播放中 无需更换视频源
      if (this.isEnd) {
        this.submitVideo.currentTime = current
        this.isEnd = false
      }
    },
    handleSliderChange (current) {
      // 滑块移动 进度条改变 相关数值需更新
      this.trackCurrentTime = current
      this.trackCurrentTimeString = formatDuration(this.trackCurrentTime)
      this.getPlayingMaterial()
      this.handleVideoChange()
      this.drawCanvasCover()
    },
    handleSubmitValid () {
      // 保存/提交剪辑前的检查
      if (this.loadingSave) {
        // 若还有数据尚在处理 不允许保存/提交
        return false
      }
      // 保存/提交前需暂停视频播放
      this.submitVideo.pause()
      this.$refs.videoInfo.validate(valid => {
        // 表单信息验证无误后 保存/提交剪辑
        if (valid) {
          this.handleVideoSubmit()
        }
      })
    },
    handleVideoSubmit () {
      // 保存/提交剪辑
    },
    formatAllMaterial () {
      // 数据规范化
      this.loadingSave = true
      let promiseContainer = []
      // 视频轨道素材数据规范化
      this.realSelectedList.forEach((item, index) => {
        item.startTime = Math.floor(item.startTime)
        item.endTime = Math.floor(item.endTime)
        item.trackStartTime = Math.floor(item.trackStartTime)
        item.trackEndTime = Math.floor(item.trackEndTime)
        item.duration = Math.floor(item.duration)
        if (/base64/.test(item.cover)) {
          promiseContainer.push(this.handleUploadCanvas(item.cover, 3, index))
        }
      })
      // 已选素材数据规范化
      this.realAddedList.forEach((item, index) => {
        item.duration = Math.floor(item.duration)
        if (/base64/.test(item.cover)) {
          promiseContainer.push(this.handleUploadCanvas(item.cover, 2, index))
        }
      })
      // 需规范的其他轨道
      const tracks = [
        {
          list: 'realPictureList',
          length: this.realPictureList.length
        },
        {
          list: 'realTextList',
          length: this.realTextList.length
        }
      ]
      // 多轨道的处理
      for (let i = 0; i < tracks.length; i++) {
        const listName = tracks[i].list
        const length = tracks[i].length

        // 无对应轨道素材时 跳过
        if (!this[listName] || !length) {
          continue
        }

        const lastMedia = this.realSelectedList[this.realSelectedList.length - 1]
        for (let j = 0; j < length; j++) {
          // 需处理超过视频轨道长度的其他轨道内容
          // 获得第一个超过视频轨长度的当前轨道素材
          const lastTrackIndex = this[listName][j].findIndex(item => {
            return item.trackStartTime < lastMedia.trackEndTime && item.trackEndTime >= lastMedia.trackEndTime
          })
          if (lastTrackIndex !== -1) {
            this[listName][j].splice(lastTrackIndex + 1)
            this[listName][j][lastTrackIndex].trackEndTime = lastMedia.trackEndTime
          }
          // 其余的数据规范操作
          this[listName][j].forEach(item => {
            item.startSecond = Math.floor(item.trackStartTime)
            item.endSecond = Math.floor(item.trackEndTime)
            item.xAxis = Math.round(this.videoInfo.firstVideoH / this.videoFrame.width * item.nowXAxis)
            item.yAxis = Math.round(this.videoInfo.firstVideoV / this.videoFrame.height * item.nowYAxis)
            const width = Math.round(this.videoInfo.firstVideoH / this.videoFrame.width * item.width)
            const height = Math.round(this.videoInfo.firstVideoV / this.videoFrame.height * item.height)
            if (listName === 'realPictureList') {
              item.mergeZoom = width + ':' + height
              item.watermark = item.fileUrl
            }
          })
        }
      }
      return Promise.all(promiseContainer).finally(() => {
        // 规范化都完成后 更新loading状态为false
        this.loadingSave = false
      })
    },
    getDrrElement (name, drrName) {
      // 设置drr的各项数值
      for (let i = 0; i < this[name].length; i++) {
        this.$store.commit('drrElementData', {
          way: false,
          isSubmit: true,
          index: this[name + 'Index'][i],
          target: this[name][i],
          vm: this.$refs[drrName][0],
          scale: {
            width: this.widthScale,
            height: this.heightScale
          }
        })
      }
    },
    getPlayingMaterial () {
      // 获取playing-
      this.lastPlayedMaterial = Object.assign({}, this.playingMaterial)
      this.tracks.forEach(track => {
        this.getPlaying(track)
      })
    },
    getPlaying (track) {
      // 获取playing-
      const trackCurrentTime = this.trackCurrentTime
      const list = track.list
      const target = track.target
      let index = null
      // if (list === 'realTransitionList') {
      //   this[list] = Various.transitionList
      // }
      // 兼容未多轨道化的视频轨道
      if (list === 'realSelectedList') {
        index = this[list].findIndex(item => {
          return item.trackStartTime <= trackCurrentTime && item.trackEndTime > trackCurrentTime
        })
        this[target] = index === -1 ? undefined : this[list][index]
        // 避免手动移到播放末尾造成的再播放错误问题
        if (!this[target]) {
          this[target] = this[list][0]
        }
      } else {
        // 记录同类型多轨道的playing-
        let tempTargetList = []
        let tempIndexIndex = []

        for (let i = 0; i < this[list].length; i++) {
          if (!this[list][i]) {
            continue
          }
          index = this[list][i].findIndex(item => {
            return item.trackStartTime <= trackCurrentTime && item.trackEndTime > trackCurrentTime
          })
          const target = index === -1 ? undefined : this[list][i][index]
          tempTargetList.push(target)
          tempIndexIndex.push(index)
        }
        this[target] = tempTargetList
        this[target + 'Index'] = tempIndexIndex
      }
    },
    getSaveParams () {
      // 设置需保存的字段
    },
    getReverseIndex (index, length) {
      // 获得数组反转后原index对应的现index
      return length - 1 + index + index * (-2)
    },
    initData () {
      // 保存/提交剪辑弹窗的信息初始化
      let lastMaterial = this.realSelectedList[this.realSelectedList.length - 1]
      this.trackDuration = Math.floor(lastMaterial.trackEndTime)
      this.playingMaterial = this.realSelectedList[0]
      this.videoSrc = this.realSelectedList[0].playUrl
      this.currentTime = Math.round(this.realSelectedList[0].startTime)
    },
    initDrrScale () {
      // 获取宽高比例 用于纠正drr的坐标及缩放显示
      this.widthScale = 640 / this.videoFrame.width
      this.heightScale = 360 / this.videoFrame.height
    },
    stopCanvasVideo () {
      clearInterval(this.canvasTimer)
    },
    drawCanvasVideo () {
      // 绘制一帧视频
      let canvasVideo = this.canvasVideo
      let ctx = canvasVideo.getContext('2d')
      let video = this.submitVideo
      // let videoTransition = this.$refs.videoTransition
      canvasVideo.width = 1280
      canvasVideo.height = 720
      this.canvasTimer = setInterval(() => {
        ctx.drawImage(video, 0, 0, canvasVideo.width, canvasVideo.height)
        // if (this.playingTransition) {
        //   ctx.drawImage(videoTransition, 0, 0, canvasVideo.width, canvasVideo.height)
        // }
      }, 40)
    },
    drawCanvasCover () {
      // 绘制视频
      let canvasVideo = this.canvasVideo
      let ctx = canvasVideo.getContext('2d')
      let video = this.submitVideo
      // let videoTransition = this.$refs.videoTransition
      canvasVideo.width = 1280
      canvasVideo.height = 720
      ctx.drawImage(video, 0, 0, canvasVideo.width, canvasVideo.height)
      // if (this.playingTransition) {
      //   videoTransition.palybackRate = this.playingTransition.palybackRate
      //   videoTransition.currentTime = this.trackCurrentTime - this.playingTransition.trackStartTime
      //   ctx.drawImage(videoTransition, 0, 0, canvasVideo.width, canvasVideo.height)
      // }
      this.isVideoLoading = false
    }
  },
  created () {
    // 设置需要的数组
    this.realSelectedList = JSON.parse(JSON.stringify(this.materialTrackList))
    this.realAddedList = JSON.parse(JSON.stringify(this.materialTabList))
    this.realPictureList = this.pictureTrackList ? JSON.parse(JSON.stringify(this.pictureTrackList)) : []
    this.realTextList = this.textTrackList ? JSON.parse(JSON.stringify(this.textTrackList)) : []
    this.reversePictureList = this.pictureTrackList ? JSON.parse(JSON.stringify(this.pictureTrackList)).reverse() : []
    this.reverseTextList = this.textTrackList ? JSON.parse(JSON.stringify(this.textTrackList)).reverse() : []
  },
  mounted () {
    // 初始化数据
    this.initData()
    this.$nextTick(() => {
      this.submitVideo = this.$refs.submitVideo
      this.canvasVideo = this.$refs.canvasVideo
      this.initDrrScale()
      // 自动播放"剪辑"后的视频
      this.handleVideoPlay()
    })
  }
}
</script>
<style lang="stylus" scoped>
.submit-video-container
  margin 0px auto
  padding 0px !important
  width 640px
  background #000
.video-frame
  width inherit
  height 360px
  canvas
    width 100%
    height 100%
.submit-video
  width 100%
  height 100%
.resizable-container
  position absolute
  top 0px
  width inherit
  height 370px
  overflow hidden
.resizable-style
  position absolute
  z-index 2
  video
    width inherit
    height inherit
    object-fit fill
  .el-image
    width inherit
    height inherit
.video-controls
  position relative
  margin-top 10px
.controls-icons
  >>>.el-image
    width 18px
    height 18px
    cursor pointer
.controls-duration
  position absolute
  top 0px
  left 30px
.video-slider
  >>>.el-slider__button
    width 10px !important
    height 10px !important
.el-icon-close
  cursor pointer
.my-error
  margin-left 90px
.cover-source
  margin-right 20px
  vertical-align top
  .cover-by-canvas
    cursor pointer
    &:hover,
    &:focus
      color #26CB51
.avatar-uploader
  display inline-block
  margin-right 10px
  border 1px dashed #d9d9d9
  border-radius 6px
  overflow hidden
  cursor pointer
  &:hover,
  &:focus
    border-color #26CB51
.horizontal-cover-uploader
  margin-left 90px
.horizontal-cover-uploader, .horizontal-cover, .horizontal-cover-icon
  width 203px
  height 114px
.vertical-cover-uploader, .vertical-cover, .vertical-cover-icon
  width 68px
  height 114px
.el-icon-plus
  line-height 114px
  font-size 28px
  color #333
.cover-message
  padding-left 90px
.submit-button-group
  margin-top 15px
</style>
<style lang="stylus" scoped>
.submit-dialog
  >>>.el-dialog
    margin-top 5vh !important
    border-radius 10px
    .el-dialog__body
      padding 30px 10px
      height auto
.input-inner
  >>>.el-input__inner
    border 0px
    border-bottom 1px solid #000
    border-radius 0px
  >>>.el-form-item__content
    display inline-block
>>>.el-form
  .el-form-item__label
    width 95px
    text-align right
  .el-form-item__error
    left 90px
    width max-content
.works-title
  >>>.el-form-item__error
    left 0px
.submit-button-group
  >>>.el-button
    margin-left 15px
    min-width 80px
>>>.el-button
  font-size 13px
>>>.el-radio-button__inner
  font-size 13px
</style>
