<template>
  <div v-loading="isLoading" class="submit-dialog">
    <el-dialog
      width="1200px"
      append-to-body
      :title="dialogTitle"
      :close-on-click-modal="false"
      :visible.sync="isSaveOrSubmit"
      :before-close="handleDialogClose"
    >
      <el-row :gutter="10">
        <!-- 播放区域 -->
        <el-col :span="14" class="submit-video-container">
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
        </el-col>
        <!-- 表单区域 -->
        <el-col :span="10">
          <el-form
            v-loading="isLoadingSelect"
            ref="videoInfo"
            :model="videoInfo"
            :rules="saveOrSubmit === 1 ? submitRules : saveRules"
          >
            <el-form-item label="作品名称：" class="input-inner works-title" prop="videoTitle">
              <el-input v-model="videoInfo.videoTitle"></el-input>
            </el-form-item>
            <el-form-item label="业务分类：" prop="businessType">
              <el-select v-model="videoInfo.businessType" @change="handleBusinessTypeChange">
                <el-option
                  v-for="type in businessTypeList"
                  :key="type.tagEnName * 1"
                  :label="type.tagCnName"
                  :value="type.tagEnName * 1"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="内容分类：" prop="categoryId">
              <el-select v-model="videoInfo.categoryId" @change="handleCategorySelelct">
                <el-option
                  v-for="type in realCategoryTypeList"
                  :key="type.tagEnName * 1"
                  :label="type.tagCnName"
                  :value="type.tagEnName * 1"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="作品类型：" prop="productType">
              <el-select v-model="videoInfo.productType">
                <el-option
                  v-for="type in productTypeList"
                  :key="type.id"
                  :label="type.label"
                  :value="type.id"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="标签：" prop="tag">
              <el-button type="primary" class="auto-tag-button" @click="getAdviceTag">自动标签</el-button>
              <span class="message">系统智能标签获取</span>
              <div class="tags-container">
                <span
                  v-for="(tag, index) in videoInfo.tag"
                  :key="tag + index"
                  class="dialog-tag"
                > {{ tag }}
                <i class="el-icon-close" @click="handleTagDelete(index)"></i>
                </span>
              </div>
              <el-input
                v-model="addTagName"
                class="input-inner tag-input"
                placeholder="输入标签按回车确认"
                @keyup.enter.native="handleAddTag"
              ></el-input>
            </el-form-item>
            <el-form-item label="封面：">
              <div class="cover-source">
                <!-- 播放区域截图直接获取封面 -->
                <span class="cover-by-canvas" @click="getCoverByVideo">
                  <i class="el-icon-upload2"></i>
                  <el-tooltip placement="top" content="拖动左侧进度条以获取指定封面图">
                    <span> 获取封面</span>
                  </el-tooltip>
                </span>
                <span class="message"> 横图竖图同时获取</span>
              </div>
              <!-- 点击封面显示区域 可本地上传设置贴图 -->
              <el-form-item prop="picH" class="pic-style">
                <el-upload
                  v-loading="loadingPicH"
                  ref="picHUploader"
                  class="avatar-uploader horizontal-cover-uploader"
                  accept="image/*"
                  list-type="picture"
                  auto-upload
                  :multiple="false"
                  :action="mediaImageUploadUrl"
                  :on-change="handleUploadChange"
                  :on-success="(value) => handleUploadSuccess(0, value)"
                  :before-upload="(value) =>handleUploadBefore(0, value)"
                >
                  <el-image
                    v-if="videoInfo.picH"
                    class="horizontal-cover"
                    :src="videoInfo.picH"
                  ></el-image>
                  <i v-else class="el-icon-plus horizontal-cover-icon"></i>
                </el-upload>
              </el-form-item>
              <el-form-item prop="picV" class="pic-style picV-style">
                <el-upload
                  v-loading="loadingPicV"
                  ref="picVUploader"
                  class="avatar-uploader vertical-cover-uploader"
                  accept="image/*"
                  list-type="picture"
                  name="picV"
                  auto-upload
                  :multiple="false"
                  :action="mediaImageUploadUrl"
                  :on-change="handleUploadChange"
                  :on-success="(value) => handleUploadSuccess(1, value)"
                  :before-upload="(value) =>handleUploadBefore(1, value)"
                >
                  <el-image
                    v-if="videoInfo.picV"
                    class="vertical-cover"
                    :src="videoInfo.picV"
                  ></el-image>
                  <i v-else class="el-icon-plus vertical-cover-icon"></i>
                </el-upload>
              </el-form-item>
              <div class="cover-message">
                <span class="message">标准尺寸 横图:750*422 竖图:266*366</span>
              </div>
            </el-form-item>
            <el-form-item label="输出设置：" prop="define">
              <el-radio-group v-model="videoInfo.define">
                <el-radio-button label="1080P"></el-radio-button>
                <el-radio-button label="720P"></el-radio-button>
                <el-radio-button label="480P"></el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <div class="submit-button-group">
            <!-- 根据传值动态显示为保存 / 提交 剪辑 -->
            <el-button v-loading="loadingSave" type="primary" @click="handleSubmitValid">{{ buttonText }}</el-button>
            <el-button type="info" @click="handleDialogClose">取消</el-button>
          </div>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>
<script>
import PictureDrr from './drrContainers/PictureDrr'
import TextDrr from './drrContainers/TextDrr'
import VideoControls from './VideoControls'
// import Various from './global/various'
import { formatDuration } from '@/components/onlineClip/global/functions'
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
    isHighlight: {
      type: Boolean,
      default: false
    },
    saveOrSubmit: {
      type: Number,
      default: 0
    },
    editId: {
      type: Number,
      default: undefined
    },
    formInfo: {
      type: Object,
      default: function () {}
    },
    videoFrame: {
      type: Object,
      default: function () {}
    },
    highlightList: {
      type: Array,
      default: function () {}
    }
  },
  data () {
    return {
      dialogTitle: '',
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
      controlsIcons: {
        play: require('../../assets/play.png'),
        pause: require('../../assets/pause.png')
      },
      coverList: [],
      mediaImageUploadUrl: '',
      // 关闭接口
      // mediaImageUploadUrl: 'api/uploadHomeImgV2.html',
      videoInfo: {
        editId: '',
        videoTitle: '',
        businessType: null,
        categoryId: null,
        categoryName: '',
        productType: 0,
        tag: [],
        picH: '',
        picV: '',
        fileId: '',
        define: '1080P',
        status: '',
        videoType: 0,
        submitTime: '',
        createdTime: '',
        modifyTime: '',
        url: '',
        userId: '',
        duration: 0,
        firstVideoH: 0,
        firstVideoV: 0
      },
      businessTypeList: [],
      categoryTypeList: [],
      realCategoryTypeList: [],
      educationType: {
        tagEnName: 30,
        tagCnName: '教育'
      },
      productTypeList: [
        {
          id: 0,
          label: '短视频'
        },
        {
          id: 1,
          label: '高能片段'
        }
      ],
      addTagName: '',
      submitRules: {
        videoTitle: [
          { required: true, message: '请输入作品名称' }
        ],
        businessType: [
          { required: true, message: '请选择业务分类', trigger: 'blur' }
        ],
        categoryId: [
          { required: true, message: '请选择内容分类', trigger: 'blur' }
        ],
        productType: [
          { required: true, message: '请选择作品类型', trigger: 'blur' }
        ],
        tag: [
          { required: true, message: '请添加标签' }
        ],
        picH: [
          { required: true, message: '请添加横封面图' }
        ],
        picV: [
          { required: true, message: '请添加竖封面图' }
        ],
        define: [
          { required: true, message: '请选择清晰度' }
        ]
      },
      saveRules: {
        videoTitle: [
          { required: true, message: '请输入作品名称' }
        ]
      },
      buttonText: '',
      loadingPicH: false,
      loadingPicV: false,
      loadingSave: false,
      isLoading: false,
      isLoadingSelect: false,
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
      if (!this.editId) {
        // 非编辑入口进入情况下 关闭保存/提交剪辑页面时需清空标签
        this.videoInfo.tag.splice(0)
      }
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
    handleBusinessTypeChange (target) {
      // 业务分类改变
      if (target * 1 === 1) {
        // 选择教育时 内容分类只能为教育
        this.realCategoryTypeList = []
        this.realCategoryTypeList.push(this.educationType)
        this.videoInfo.categoryId = 30
        this.videoInfo.categoryName = '教育'
      } else {
        this.realCategoryTypeList = this.categoryTypeList
      }
    },
    handleCategorySelelct (tagEnName) {
      // 需根据内容分类index获取名称
      let target = this.categoryTypeList.find(item => {
        return item.tagEnName * 1 === tagEnName * 1
      })
      this.videoInfo.categoryName = target.tagCnName
    },
    handleTagDelete (index) {
      this.videoInfo.tag.splice(index, 1)
    },
    handleAddTag () {
      // 添加标签
      // 去除输入中的空格
      const tag = this.addTagName.replace(/\s/g, '')
      // 判断标签是否已存在
      const index = this.videoInfo.tag.findIndex(item => {
        return item === tag
      })
      if (index !== -1) {
        this.$message({
          type: 'warning',
          message: '该标签已存在'
        })
      }
      // 标签不存在 push
      if (tag && index === -1) {
        this.videoInfo.tag.push(tag)
        this.addTagName = ''
      }
      this.addTagName = ''
      this.$refs.videoInfo.validateField('tag')
    },
    handleUploadChange (file, fileList) {
      // 本地上传添加
      if (fileList.length > 1) {
        fileList.splice(0, 1)
      }
    },
    handleUploadSuccess (index, value) {
      // 本地上传封面 根据index判断是横图/竖图
      if (index) {
        this.videoInfo.picV = value.url
        this.loadingPicV = false
        this.$refs.videoInfo.validateField('picV')
      } else {
        this.videoInfo.picH = value.url
        this.loadingPicH = false
        this.$refs.videoInfo.validateField('picH')
      }
    },
    handleUploadBefore (index) {
      // 本地上传封面前 根据index判断是横图/竖图并设置对应状态
      if (index) {
        this.loadingPicV = true
      } else {
        this.loadingPicH = true
      }
    },
    handleUploadCanvas () {},
    // 关闭接口
    // handleUploadCanvas (value, target, index) { // target: 0 picH, 1 picV, 2 added, 3 selected
      // 处理上传至CDN的图片
      // const imageFile = this.transferBase64ToFile(value)
      // let form = new FormData()
      // form.append('file', imageFile)
      // return this.$service.uploadCover(form).then(data => {
      //   switch (target) {
      //     case 0:
      //       this.videoInfo.picH = data.url
      //       break
      //     case 1:
      //       this.videoInfo.picV = data.url
      //       break
      //     case 2:
      //       this.realAddedList[index].cover = data.url
      //       break
      //     case 3:
      //       this.realSelectedList[index].cover = data.url
      //       break
      //   }
      //   return true
      // })
    // },
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
      this.isLoading = true
      let promiseContainer = []
      promiseContainer.push(this.judgeCoverType())
      promiseContainer.push(this.formatAllMaterial())
      // 所有数据转换完成后 save
      Promise.all(promiseContainer).then(() => {
        // 关闭接口
        // const params = this.getSaveParams()
        // this.$service.saveClippedVideo(params).then(() => {
        //   if (this.saveOrSubmit) {
        //     this.$message({
        //       type: 'success',
        //       message: '提交剪辑成功！请在【短视频生产】-【剪辑队列】中确认'
        //     })
        //   } else {
        //     this.$message({
        //       type: 'success',
        //       message: '保存作品成功！请在【短视频生产】-【我保存的作品】中确认'
        //     })
        //   }
        //   this.isLoading = false
        //   // 保存成功 关闭剪辑页面
        //   this.$emit('all-close')
        // })
      }).catch(() => {
        this.isLoading = false
        this.$message.error('网络异常，请稍后再试')
      })
    },
    transferBase64ToFile (base64) {
      // 将base64类型的图片转化为文件类型
      let arr = base64.split(',')
      let mime = arr[0].match(/:(.*?);/)[1]
      let str = atob(arr[1])
      let n = str.length
      let u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = str.charCodeAt(n)
      }
      return new File([u8arr], 'cover.jpg', { type: mime })
    },
    judgeCoverType () {
      // 判断横图/竖图
      const base64 = /base64/
      const picH64 = base64.test(this.videoInfo.picH)
      const picV64 = base64.test(this.videoInfo.picV)
      let promiseContainer = []
      if (picH64) {
        promiseContainer.push(this.handleUploadCanvas(this.videoInfo.picH, 0))
      }
      if (picV64) {
        promiseContainer.push(this.handleUploadCanvas(this.videoInfo.picV, 1))
      }
      return Promise.all(promiseContainer)
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
          // 当前为保存剪辑时 无需处理; 为提交剪辑时 需裁剪到视频轨道长度
          if (lastTrackIndex !== -1 && this.saveOrSubmit) {
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
      let params = { ...this.videoInfo }
      params.tag = this.videoInfo.tag.toString()
      params.rlsList = this.realSelectedList
      params.rlsVideos = this.realAddedList
      // 贴图轨道实际上为单轨
      params.pics = this.realPictureList[0]
      // params.transitionsDTOS = Various.transitionList
      params.transitionsDTOS = []
      params.textDTOS = this.realTextList
      return params
    },
    getCoverByVideo () {
      // 获取封面 - 横图竖图
      let canvasH = document.createElement('canvas')
      let canvasV = document.createElement('canvas')
      let video = this.submitVideo
      const vWidth = video.videoWidth / 3
      const vheight = video.videoHeight
      canvasH.width = 640
      canvasH.height = 360
      canvasV.width = 640 / 3
      canvasV.height = 360
      canvasH.getContext('2d').drawImage(video, 0, 0, canvasH.width, canvasH.height)
      canvasV.getContext('2d').drawImage(video, vWidth, 0, vWidth, vheight, 0, 0, canvasV.width, canvasV.height)
      this.videoInfo.picH = canvasH.toDataURL('image/jpeg')
      this.videoInfo.picV = canvasV.toDataURL('image/jpeg')
      this.$refs.videoInfo.validateField('picV')
      this.$refs.videoInfo.validateField('picH')
    },
    getReverseIndex (index, length) {
      // 获得数组反转后原index对应的现index
      return length - 1 + index + index * (-2)
    },
    getAdviceTag () {},
    // 关闭接口
    // getAdviceTag () {
    //   // 智能标签获取
    //   const target = this.realSelectedList.find(item => {
    //     // 获取非本地上传素材的coocaaVId
    //     return item.coocaaVId * 1 !== -1
    //   })
    //   this.$service.getAdviceTag({ coocaaVId: target.coocaaVId }).then(data => {
    //     if (!data.data.length) {
    //       this.$message({
    //         type: 'warning',
    //         message: '素材暂无智能标签'
    //       })
    //     } else {
    //       this.$message({
    //         type: 'success',
    //         message: '智能标签获取成功，已进行重复剔除'
    //       })
    //       // 剔除重复标签
    //       const list = data.data.split(',')
    //       for (let i = 0; i < list.length; i++) {
    //         const tag = this.videoInfo.tag.find(item => {
    //           return list[i] === item
    //         })
    //         if (!tag) {
    //           this.videoInfo.tag.push(list[i])
    //         }
    //       }
    //     }
    //   }).catch(() => {
    //     this.$message({
    //       type: 'warning',
    //       message: '素材暂无智能标签'
    //     })
    //   })
    // },
    initForm () {
      // 编辑入口进入 同步先前数据
      this.videoInfo = { ...this.formInfo }
      if (this.videoInfo.tag.length === 1 && this.videoInfo.tag[0] === '') {
        this.videoInfo.tag.pop()
      }
      this.isLoadingSelect = false
    },
    initData () {
      // 保存/提交剪辑弹窗的信息初始化
      let lastMaterial = this.realSelectedList[this.realSelectedList.length - 1]
      this.videoInfo.videoType = this.saveOrSubmit
      this.videoInfo.duration = lastMaterial.trackEndTime
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
    fetchData () {
      // 关闭接口
      // 获取业务分类与内容分类
      // this.$service.queryMaterialResource().then(data => {
      //   this.businessTypeList = data.businessType
      //   this.categoryTypeList = data.categoryType
      //   this.categoryTypeList.push(this.educationType)
      //   this.realCategoryTypeList = this.categoryTypeList
      // })
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
    this.realSelectedList = this.isHighlight ? JSON.parse(JSON.stringify(this.highlightList)) : JSON.parse(JSON.stringify(this.materialTrackList))
    this.realAddedList = this.isHighlight ? JSON.parse(JSON.stringify(this.highlightList)) : JSON.parse(JSON.stringify(this.materialTabList))
    this.realPictureList = this.pictureTrackList ? JSON.parse(JSON.stringify(this.pictureTrackList)) : []
    this.realTextList = this.textTrackList ? JSON.parse(JSON.stringify(this.textTrackList)) : []
    this.reversePictureList = this.pictureTrackList ? JSON.parse(JSON.stringify(this.pictureTrackList)).reverse() : []
    this.reverseTextList = this.textTrackList ? JSON.parse(JSON.stringify(this.textTrackList)).reverse() : []
    // 获取接口数据
    this.fetchData()
    if (this.editId) {
      // 编辑入口进入 需同步先前数据
      this.isLoadingSelect = true
      this.initForm()
    }
    // 规范化数组数据
    this.formatAllMaterial()
    // 根据saveOrSubmit动态显示文本
    if (this.saveOrSubmit) {
      this.dialogTitle = '提交剪辑'
      this.buttonText = '确认提交'
    } else {
      this.dialogTitle = '保存剪辑'
      this.buttonText = '确认保存'
    }

    if (!this.isHighlight) {
      // 智能识别入口进入 作品类型只允许为短视频
      this.productTypeList.pop()
    }
  },
  mounted () {
    // 初始化数据
    this.initData()
    this.$nextTick(() => {
      this.submitVideo = this.$refs.submitVideo
      this.canvasVideo = this.$refs.canvasVideo
      if (!this.isHighlight) {
        // 非智能识别入口进入 需获取drr比例
        this.initDrrScale()
      }
      // 自动播放"剪辑"后的视频
      this.handleVideoPlay()
    })
  }
}
</script>
<style lang="stylus" scoped>
.submit-video-container
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
.auto-tag-button
  margin-right 10px
.message
  font-size 12px
  color #ccc
  cursor default
.tags-container
  margin-top 18px
  padding-left 90px
.dialog-tag
  display inline-block
  margin 0px 20px 10px 0px
  padding 0px 12px
  height 25px
  line-height 25px
  font-size 13px
  color #ef6139
  border 1px solid #ccc
  border-radius 5px
  background #f2f2f2
.el-icon-close
  cursor pointer
.tag-input
  padding-left 90px
  width -webkit-fill-available
.my-error
  margin-left 90px
.cover-source
  margin-right 20px
  vertical-align top
  .cover-by-canvas
    cursor pointer
    &:hover,
    &:focus
      color #409eff
.avatar-uploader
  display inline-block
  margin-right 10px
  border 1px dashed #d9d9d9
  border-radius 6px
  overflow hidden
  cursor pointer
  &:hover,
  &:focus
    border-color #409eff
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
  &:hover,
  &:focus
    color #409eff
.pic-style
  display inline-block
  margin-bottom 0px
.cover-message
  padding-left 90px
.submit-button-group
  margin-top 15px
</style>
<style lang="stylus" scoped>
.submit-dialog
  >>>.el-dialog
    margin-top 5vh !important
    // height 90vh
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
.picV-style
  >>>.el-form-item__error
    left 0px
.pic-style
  >>>.el-form-item__error
    margin-top -10px
.submit-button-group
  >>>.el-button
    margin-left 15px
    width 80px
</style>
