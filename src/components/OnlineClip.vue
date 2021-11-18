<template>
  <div
    v-loading="isClipLoading"
    element-loading-text="努力加载中..."
    element-loading-background="rgba(0, 0, 0, 0.8)"
    element-loading-custom-class="loading-style"
    id="onlineClip"
    class="online-clip"
  >
    <el-row class="main-area">
      <el-col :span="15" id="materialArea" class="material-cols" ref="tabsCol">
        <!-- tabs素材区域 -->
        <el-row class="material-area">
          <el-tabs v-model="onlineTab" class="online-clip-tabs">
            <el-tab-pane name="materialTab">
              <span slot="label"><i class="el-icon-folder-opened"></i> 已选素材</span>
              <MaterialTab
                v-if="onlineTab === 'materialTab'"
                ref="materialTab"
                id="materialItem"
                @update-date="updatePointerData"
                @video-data="handleVideoDataSet"
                @video-cover="drawCanvasVideoCover"
                @selected-click="handleSelectedClick"
                @show-material-dialog="handleShowMaterialDialog"
              ></MaterialTab>
            </el-tab-pane>
            <el-tab-pane name="pictureTab">
              <span slot="label"><i class="el-icon-picture-outline"></i> 贴图</span>
              <PictureTab
                v-if="onlineTab === 'pictureTab'"
                ref="pictureTab"
                :tab-name="onlineTab"
                @icon-add="handleIconAdd"
              ></PictureTab>
            </el-tab-pane>
            <el-tab-pane name="textTab">
              <span slot="label">
                <span class="diy-icon-t">T</span> 字幕
              </span>
              <TextTab
                v-if="onlineTab === 'textTab'"
                :is-edit="isTextEdit"
                @icon-add="handleIconAdd"
                @stop-edit="handleCancelEdit"
              ></TextTab>
            </el-tab-pane>
            <el-tab-pane>
              <span slot="label"><i class="el-icon-guide"></i> 转场</span>
              <TempMessage></TempMessage>
            </el-tab-pane>
            <el-tab-pane>
              <span slot="label"><i class="el-icon-service"></i> 配乐</span>
              <TempMessage></TempMessage>
            </el-tab-pane>
            <el-tab-pane>
              <span slot="label"><i class="el-icon-magic-stick"></i> 滤镜</span>
              <TempMessage></TempMessage>
            </el-tab-pane>
          </el-tabs>
        </el-row>
      </el-col>
      <el-col :span="9" class="video-cols" ref="videoCols">
        <!-- 右上角信息图标区域 -->
        <div class="info-icon-area">
          <el-tooltip content="* 视频长度以视频轨道长度为准。" placement="bottom">
            <i class="el-icon-info"></i>
          </el-tooltip>
          <el-tooltip content="点击显示引导" placement="bottom">
            <i class="el-icon-place" @click="startGuider"></i>
          </el-tooltip>
        </div>
        <!-- 播放及drr操作区域 -->
        <div v-loading="isLoadingVideo" id="videoArea" class="video-frame" ref="videoFrame">
          <video id="video" ref="video" preload="auto" crossOrigin="*" style="display: none" :src="videoSrc"></video>
          <!-- <video
            ref="videoTransition"
            style="display: none"
            preload="auto"
            crossOrigin="*"
            :src="playingTransition ? playingTransition.transitionMaterialUrl : ''"
          ></video> -->
          <canvas id="canvasVideo" ref="canvasVideo" class="canvas-video"></canvas>
          <!-- 先定义的在下层 -->
          <PictureDrr
            v-for="(item, index) in reversePictureList"
            :key="'pictureDrr' + getReverseIndex(index, reversePictureList.length)"
            ref="pictureDrr"
            :track-index="getReverseIndex(index, reversePictureList.length)"
            :track-list="item"
            :key-code="keyCode"
            :video-play="videoPlay"
            :is-text-edit="isTextEdit"
            @video-pause="handleVideoPause"
            @stop-edit="handleCancelEdit"
          ></PictureDrr>
          <TextDrr
            v-for="(item, index) in reverseTextList"
            :key="'textDrr' + getReverseIndex(index, reverseTextList.length)"
            ref="textDrr"
            :id="'textDrr' + getReverseIndex(index, reverseTextList.length)"
            :track-index="getReverseIndex(index, reverseTextList.length)"
            :track-list="item"
            :key-code="keyCode"
            :video-play="videoPlay"
            :is-text-edit="isTextEdit"
            @text-edit="handleTextEdidState"
            @video-pause="handleVideoPause"
            @stop-edit="handleCancelEdit"
          ></TextDrr>
        </div>
        <div class="video-controls">
          <!-- 播放器控制条区域 -->
          <div class="controls-icons">
            <el-image v-if="!videoPlay" class="controls-play" :src="controlsIcons.play" @click="handleVideoPlay"></el-image>
            <el-image v-if="videoPlay" class="controls-pause" :src="controlsIcons.pause" @click="handleVideoPause"></el-image>
          </div>
          <div class="controls-duration">
            {{ trackCurrentTime }} / {{ trackDurationString }}
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row id="buttonArea" class="operations-area">
      <div class="operations-convenient">
        <!-- 本期不实现 -->
        <!-- <i class="el-icon-back"></i>
        <i class="el-icon-right"></i> -->
        <i
          id="deleteIcon"
          :class="{
            'el-icon-delete': true,
            'custom-i-hover': !selected.type
          }"
          @click="keyUpMonitor({ keyCode: 46 })"
        ></i>
        <i
          id="clipIcon"
          :class="{
            'el-icon-scissors': true,
            'custom-i-hover': materialTrackList.length === 0 || banClip || videoPlay
          }"
          @click="handleMediaClip"
        ></i>
      </div>
      <!-- 本期不实现 -->
      <!-- <TimeScaleSlider
        :sliderData="sliderData"
      ></TimeScaleSlider> -->
      <!-- <el-alert
        class="transition-alert"
        type="warning"
        close-text="知道了"
        title="【视频轨道】的添加、删除、移动、剪辑等操作，均会【重置所有转场】"
        show-icon
        @close="handleAlertClose"
      ></el-alert> -->
      <div id="submitButton" class="operations-save">
        <el-button class="save-clip" @click="handleSaveOrSubmit()">保存剪辑</el-button>
      </div>
    </el-row>
    <el-row id="tracksArea" class="axis-area">
      <!-- 轨道内容区域 -->
      <el-col :span="1" class="clip-resource-icons" ref="clipResourceIcons">
        <!-- 左侧图标区域 -->
        <div class="empty-icon" ref="emptyIcon"><!-- 用于设置页面样式 --></div>
        <div id="multiTracksItem">
          <div
            v-for="(item, index) in textTrackList"
            :key="index"
            @mouseover="handleIconHover(index, '文字', 'text')"
            @mouseout="isShowUl = false"
          >
            <span
              class="track-type-icon"
              :style="{
                color: showUlIndex === index && ulName === 'text' && isShowUl ? '#26CB51' : '#606266'
              }"
            > T </span>
          </div>
        </div>
        <i class="el-icon-picture-outline track-type-icon"></i>
        <i class="el-icon-video-camera track-type-icon"></i>
        <i class="el-icon-service track-type-icon"></i>
        <!-- 多轨道设置ul: 提供轨道添加 删除 复制 -->
        <MultiTracksUl
          v-show="isShowUl"
          class="multi-tracks-ul"
          :index="showUlIndex"
          :icon-width="iconWidth"
          :text="ulText"
          :name="ulName"
          :style="{
            top: getUlTop() + 15 + 'px',
            left: iconWidth + 'px'
          }"
          @mouseover.native="isShowUl = true"
          @mouseout.native="isShowUl = false"
        ></MultiTracksUl>
      </el-col>
      <el-col :span="23" ref="clipResource" class="clip-resource">
        <!-- 右侧轨道操作区域 -->
        <Pointer
          ref="pointer"
          class="pointer-style"
          :video-play="videoPlay"
          :width-range="trackDuration * trackScale"
          @pause-video="handleVideoPause"
          @set-pointer-track="setPointerAndTrack"
          @current-material="judgeVideoSource"
          @current-picture="judgePictureSource"
          @current-text="judgeTextSource"
          @current-transition="judgeTransitionSource"
        ></Pointer>
        <el-row class="time-axis" ref="timeAxis">
          <TimeAxis
            :material-duration="trackDuration"
            @move-by-axis="changePointerStart"
          ></TimeAxis>
        </el-row>
        <el-row
          v-for="(item, index) in textTrackList"
          :key="'textTrack' + index"
          :style="{ width: timeAxisDuration * trackScale + 500 > 6000 ? timeAxisDuration * trackScale + 500 + 'px' : '6000px' }"
        >
          <TextTrack
            ref="textTrack"
            :track-index="index"
            :track-list="item"
            @click-text="handleTrackClick"
            @mousedown-text="handleTrackMouseDown"
          ></TextTrack>
        </el-row>
        <el-row
          v-for="(item, index) in pictureTrackList"
          :key="'pictureTrack' + index"
          :style="{ width: timeAxisDuration * trackScale + 500 > 6000 ? timeAxisDuration * trackScale + 500 + 'px' : '6000px' }"
        >
          <PictureTrack
            ref="pictureTrack"
            :track-list="item"
            @click-picture="handleTrackClick"
            @mousedown-picture="handleTrackMouseDown"
          ></PictureTrack>
        </el-row>
        <el-row
          class="video-track"
          id="video-track"
          :style="{ width: timeAxisDuration * trackScale + 500 > 6000 ? timeAxisDuration * trackScale + 500 + 'px' : '6000px' }"
        >
          <MaterialTrack
            :video-play="videoPlay"
            @selected-click="handleSelectedClick"
            @video-pause="handleVideoPause"
          ></MaterialTrack>
          <TransitionTrack
            ref="transitionTrack"
            :is-save-or-submit="isSaveOrSubmit"
          ></TransitionTrack>
        </el-row>
        <el-row :style="{ width: timeAxisDuration * trackScale + 500 > 6000 ? timeAxisDuration * trackScale + 500 + 'px' : '6000px' }"></el-row>
      </el-col>
    </el-row>
    <!-- 素材推荐弹窗 -->
    <el-dialog
      v-if="isShowMaterialAdd"
      title="添加素材"
      width="95%"
      class="add-material-dialog"
      :visible.sync="isShowMaterialAdd"
      :append-to-body="true"
      :modal-append-to-body="true"
    >
      <TempMessage></TempMessage>
    </el-dialog>
    <!-- 保存/提交剪辑弹窗 -->
    <SubmitClip
      v-if="isSaveOrSubmit"
      :is-save-or-submit="isSaveOrSubmit"
      :video-frame="videoFrame"
      @submit-close="handleSubmitClose"
      @all-close="handleAllClose"
    ></SubmitClip>
  </div>
</template>
<script>
import TimeAxis from './TimeAxis'
import Pointer from './Pointer'
import SubmitClip from './SubmitClip'
import TempMessage from './TempMessage'
import MultiTracksUl from './tracks/MultiTracksUl'
import MaterialTab from './tabs/MaterialTab'
import MaterialTrack from './tracks/MaterialTrack'
import PictureTab from './tabs/PictureTab'
import PictureTrack from './tracks/PictureTrack'
import TextTab from './tabs/TextTab'
import TextTrack from './tracks/TextTrack'
import TransitionTrack from './tracks/TransitionTrack'
import PictureDrr from './drrContainers/PictureDrr'
import TextDrr from './drrContainers/TextDrr'
import { formatDuration } from '@/components/global/functions'
import { mapState } from 'vuex'
import steps from './guide'
export default {
  components: {
    TimeAxis,
    Pointer,
    SubmitClip,
    TempMessage,
    MultiTracksUl,
    MaterialTab,
    MaterialTrack,
    PictureTab,
    PictureTrack,
    TextTab,
    TextTrack,
    TransitionTrack,
    PictureDrr,
    TextDrr
  },
  data () {
    return {
      isClipLoading: false,
      onlineTab: 'materialTab',
      tempTabName: 'materialTab',
      isShowMaterialAdd: false,
      videoInfo: {
        editId: '',
        videoTitle: '',
        businessType: '',
        categoryId: '',
        categoryName: '',
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
        productType: 0
      },
      videoPlay: false,
      controlsIcons: {
        play: require('../assets/play.png'),
        pause: require('../assets/pause.png')
      },
      banClip: false,
      isLimit: false,
      trackCurrentTime: '00:00:00',
      trackDurationString: '00:00:00',
      sliderData: 0,
      videoSrc: '',
      videoTarget: undefined,
      duration: 0,
      realLeft: 0,
      isInputting: false,
      isSaveOrSubmit: false,
      titleHeight: 70,
      canvasWidth: 100,
      canvasVideo: null,
      canvasVideo2: null,
      canvasTimer: null,
      tempTransitionList: [],
      videoFrame: {
        width: null,
        height: null
      },
      keyCode: null,
      isLoadingVideo: false,
      isShowUl: false,
      showUlIndex: null,
      ulText: null,
      ulName: null,
      isTextEdit: false,
      clipResource: null,
      oldPictureIndex: null,
      iconWidth: 0,
      playingIndex: null
    }
  },
  computed: {
    ...mapState({
      trackScale: state => state.trackScale,
      defaultMaterialHeight: state => state.defaultMaterialHeight,
      materialTrackWidth: state => state.materialTrackWidth,
      trackDuration: state => state.timeAxisDuration, // 取所有轨道之中的时长最大值作为视频长度
      timeAxisDuration: state => state.timeAxisDuration,
      pointerLeft: state => state.pointerLeft,
      pointerDuration: state => state.pointerDuration,
      operationIndex: state => state.operationIndex,
      activeName: state => state.activeName,
      operationName: state => state.operationName,
      selected: state => state.selected,
      selectedTarget: state => state.selectedTarget,
      playingMaterial: state => state.playingMaterial,
      playingPicture: state => state.playingPicture,
      playingPictureIndex: state => state.playingPictureIndex,
      playingText: state => state.playingText,
      playingTextIndex: state => state.playingTextIndex,
      playingTransition: state => state.playingTransition,
      materialTrackList: state => state.materialTrackList,
      pictureTrackList: state => state.pictureTrackList,
      textTrackList: state => state.textTrackList
    }),
    reversePictureList: function () {
      // 反转的pictureTrackList 用于在页面中drr能够按所需的层级显示
      return JSON.parse(JSON.stringify(this.pictureTrackList)).reverse()
    },
    reverseTextList: function () {
      // 反转的textTrackList 用于在页面中drr能够按所需的层级显示
      return JSON.parse(JSON.stringify(this.textTrackList)).reverse()
    }
  },
  watch: {
    trackDuration: function (val) {
      // 视频轨道时长改变 控制条的显示时间也需改变
      this.trackDurationString = formatDuration(val)
    },
    activeName: function (val) {
      if (val) {
        // activeName不为null时 激活Drr对应操作页同时跳转对应tabs
        this.tempTabName = this.onlineTab
        this.onlineTab = val + 'Tab'
      } else {
        // activeName为null时 跳转回原tabs
        this.onlineTab = this.tempTabName
      }
    },
    pointerDuration: function (val) {
      // 监听 - 指针位置 主要用于判断当前是否可剪辑
      const selected = this.selectedTarget
      if (!selected) {
        // selectedTarget不存在 不可剪辑
        return false
      }
      if (this.selected.type !== 'materialTrackList') {
        // 所选块不为视频轨道块 不可剪辑 - 只有视频轨道素材才能使用裁剪
        this.banClip = true
        return false
      }
      if (val <= selected.trackStartTime || val >= selected.trackEndTime) {
        // 判断指针是否在选择块区域内 - 是否可剪辑
        this.banClip = true
      } else {
        this.banClip = false
      }
      // 视频在播放中因转场换源加载原因暂停时 需重新播放
      if (this.videoTarget.paused && this.videoPlay) {
        this.handleVideoPlay()
      }
    },
    selectedTarget: function (val) {
      // 监听 - 轨道选择块 主要用于判断当前是否可剪辑
      if (!val) {
        // selectedTarget不存在 不可剪辑
        return false
      }
      if (this.selected.type !== 'materialTrackList') {
        // 所选块不为视频轨道块 不可剪辑 - 只有视频轨道素材才能使用裁剪
        this.banClip = true
        return true
      }
      const pointerDuration = this.pointerDuration
      if (pointerDuration <= val.trackStartTime || pointerDuration >= val.trackEndTime) {
        this.banClip = true
      } else {
        this.banClip = false
      }
    },
    playingPicture: function (val) {
      // 监听 - 正在播放的贴图 用于及时播放视频贴图
      if (this.oldPictureIndex === this.playingPictureIndex[0]) {
        // 避免视频贴图的卡顿 以及 不同视频贴图切换时 所导致的骤停报错问题
        return true
      }
      if (val[0] && val[0].fileType === 'video') {
        if (this.videoPlay) {
          this.playVideoPicture(val[0], true)
        } else {
          this.playVideoPicture(val[0], false)
        }
      }
    },
    playingTransition: function () {
      // let videoTransition = this.$refs.videoTransition
      // if (!val) {
      //   videoTransition.src = ''
      //   return true
      // }
      // if (this.videoPlay && val && val.transitionMaterialUrl) {
      //   setTimeout(() => {
      //     videoTransition.src = val.transitionMaterialUrl
      //     videoTransition.playbackRate = val.playbackRate
      //     videoTransition.currentTime = (this.pointerDuration - val.trackStartTime) * val.playbackRate
      //     videoTransition.play()
      //   }, 150)
      // }
    }
  },
  methods: {
    handleOnclipClose () {
      // 关闭在线剪辑页面时的处理
    },
    handleVideoDataSet (url, time) {
      // 设置播放区域视频地址及所播时刻
      this.videoSrc = url
      this.videoTarget.currentTime = time
    },
    handleSelectedClick (e, index, target, trackIndex) {
      // 点击轨道块
      const realList = target === 'materialTrackList' ? this.materialTrackList : undefined
      this.$store.dispatch('setTrackBlockSelect', { e: e, index: index, trackIndex: trackIndex, list: target, realList: realList, vm: this })
    },
    handleShowMaterialDialog () {
      // 显示素材添加弹窗
      if (this.videoPlay) {
        // 若播放中 需暂停
        this.handleVideoPause()
      }
      this.isShowMaterialAdd = true
    },
    handleVideoPlayOrPause () {
      // 控制播放区域的播放/暂停
      if (this.videoPlay) {
        this.handleVideoPause()
      } else {
        this.handleVideoPlay()
      }
    },
    handleVideoPlay () {
      // 播放视频
      if (!this.materialTrackList.length) {
        // 视频轨道为空 不允许播放
        this.$message({
          type: 'warning',
          message: '视频轨道为空，请添加素材至轨道后再尝试播放'
        })
        return false
      }
      if (this.isLoadingVideo) {
        // 视频加载中 不允许播放
        return false
      }
      setTimeout(() => {
        // 需计时等待一会 避免立即播放/暂停所导致的播放失败及控制台报错
        if (this.videoTarget.src) {
          this.videoPlay = true
          this.videoTarget.play()
        }
        const drrTarget = this.$refs.pictureDrr[0].$refs.drrTarget ? this.$refs.pictureDrr[0].$refs.drrTarget[0] : null
        if (drrTarget && this.playingPicture[0].fileType === 'video') {
          // 若存在需要播放的视频贴图 播放
          drrTarget.currentTime = this.pointerDuration - this.playingPicture[0].trackStartTime
          drrTarget.play()
        }
        // if (this.playingTransition && this.playingTransition.transitionMaterialUrl) {
        //   const videoTransition = this.$refs.videoTransition
        //   videoTransition.src = this.playingTransition.transitionMaterialUrl
        //   videoTransition.playbackRate = this.playingTransition.playbackRate
        //   videoTransition.currentTime = (this.pointerDuration - this.playingTransition.trackStartTime) * videoTransition.playbackRate
        //   videoTransition.play()
        // }
      }, 150)
    },
    handleVideoPause () {
      // 暂停视频
      this.videoPlay = false
      if (this.videoTarget.src) {
        this.videoTarget.pause()
      }
      const drrTarget = this.$refs.pictureDrr[0].$refs.drrTarget ? this.$refs.pictureDrr[0].$refs.drrTarget[0] : null
      if (drrTarget && this.playingPicture[0].fileType === 'video') {
        // 设置为null是避免视频贴图播放时暂停后的无法再次播放
        this.oldPictureIndex = null
        drrTarget.pause()
      }
      // if (this.playingTransition && this.playingTransition.transitionMaterialUrl) {
      //   this.$refs.videoTransition.pause()
      // }
    },
    handleTextEdidState (state) {
      // 记录text-drr的编辑状态
      this.isTextEdit = state
    },
    handleAlertClose () {
      // 公告的关闭通知
      this.$notify({
        type: 'success',
        dangerouslyUseHTMLString: true,
        message: '消息可在左上角 <i class="el-icon-question"></i> 中重新查看哦'
      })
    },
    handleSaveOrSubmit () {
      // 保存/提交剪辑弹窗
      if (this.videoPlay) {
        // 若视频播放中 需暂停
        this.handleVideoPause()
      }
      if (this.materialTrackList.length) {
        this.isSaveOrSubmit = true
      } else {
        this.$message({
          type: 'warning',
          message: '轨道无素材, 请选取素材进行操作后再保存'
        })
      }
    },
    handleIconHover (index, text, name) {
      this.showUlIndex = index
      this.ulText = text
      this.ulName = name
      this.isShowUl = true
    },
    handleMediaClip () {
      // 裁剪所选视频轨道块
      if (this.materialTrackList.length === 0 || this.banClip || this.videoPlay) {
        // 当前为不可剪辑状态 false
        return false
      }
      // 更新指针在当前选择块位置数据
      this.realLeft = (this.pointerDuration - this.selectedTarget.trackStartTime) * this.trackScale
      this.beginMediaClip()
      this.finishMediaClip()
    },
    handleMediaDelete () {
      // 视频轨道素材删除
      if (this.videoPlay) {
        // 若播放中 暂停播放
        this.handleVideoPause()
      }
      if (this.materialTrackList.length === 0) {
        // 若轨道已为空 false
        return false
      }

      const index = this.selected.index
      const width = this.selected.width
      // 获取删除的时长
      const moveDuration = this.getDurationByWidth(width)

      let list = this.materialTrackList
      // 重新渲染所涉及的轨道块
      for (let i = index; i < this.materialTrackList.length - 1; i++) {
        let before = document.getElementById('clip' + (i + 1))
        let after = document.getElementById('clip' + i)
        after.style = `
          width: ${before.style.width};
          height: ${before.style.height};
          background-image: ${before.style.backgroundImage};
          background-size: auto 100%
        `
        this.$store.commit('updateMateriaTime', { duration: moveDuration, index: i + 1, operator: 0 })
      }

      // 删除对应的轨道块数据
      this.$store.commit('updateArrayDelete', { name: 'materialTrackList', index: index, amount: 1 })

      if (this.materialTrackList.length === 0) {
        // 删除后 轨道为空 需清理各值
        this.updatePointerData(0, false)
        this.$store.commit('clearSelected')
        this.$store.commit('updatePlayingTarget', { target: 'playingMaterial', value: {}, index: undefined })
        this.videoSrc = ''
        // 清空画布
        this.canvasVideo.width = this.videoFrame.width * 2
        // 避免视频加载中时清空轨道后 所导致的加载状态不更新问题
        this.isLoadingVideo = false
      } else {
        // 删除后 轨道不为空 需更新各值 并 获取下一个选中的轨道块
        const nextMedia = list[index - 1] || list[index]
        const last = list[list.length - 1]
        let targetIndex = index > 0 ? index - 1 : index
        let target = document.getElementById('clip' + (index - 1)) || document.getElementById('clip' + index)

        this.videoSrc = nextMedia.playUrl
        this.videoTarget.currentTime = nextMedia.endTime

        this.handleSelectedClick(target, targetIndex, 'materialTrackList')

        // 如果删除后 指针在所有轨道块之外 则移动至最后的轨道块上
        if (this.pointerDuration > last.trackEndTime) {
          this.updatePointerData(last.trackEndTime, false)
        }

        // 更新playing-
        this.$refs.pointer.judgePlayingTarget()
      }
      // 更新轨道长度
      this.$store.commit('updateValue', { name: 'materialTrackWidth', value: this.materialTrackWidth - width })
      // 更新trackTime
      this.$store.commit('getTracksDration', 'materialTrackList')
      // 更新转场
      // this.$store.commit('updateValue', { name: 'operationName', value: 'delete' })
      // this.$store.commit('updateValue', { name: 'operationIndex', value: index })
    },
    handleSubmitClose () {
      // 关闭保存/提交剪辑对话框
      this.isSaveOrSubmit = false
    },
    handleAllClose () {
      // 已成功保存/提交剪辑
      this.isSaveOrSubmit = false
    },
    handleTrackMouseDown (e, index, trackIndex, name, isNeedTab) { // isNeedTab: 用于区分是否需要激活对应DRR - 在轨道拖拽操作中不必激活
      // mousedown轨道块
      if (this.videoPlay) {
        this.handleVideoPause()
      }
      if (isNeedTab) {
        this.$refs[name + 'Drr'][trackIndex].handleActive(index, true)
      }
      this.handleSelectedClick(e, index, name + 'TrackList', trackIndex)
    },
    handleTrackClick (e, index, trackIndex, target, tabName, active) {
      // 点击轨道块
      if (this.videoPlay) {
        this.handleVideoPause()
      }

      const selected = this[target][trackIndex][index]
      // 更新tabs页显示
      this.onlineTab = tabName

      this.$nextTick(() => {
        if (selected.trackStartTime >= this.trackDuration) {
          // 若所选轨道块在视频轨道长度外 取消active-drr
          this.$store.commit('updateValue', { name: 'activeName', value: null })
          this.handleSelectedClick(e, index, target, trackIndex)
        } else {
          // 若所选轨道块在视频轨道长度内
          let duration = selected.trackStartTime + (selected.realRange / this.trackScale) / 2
          // 获取duration - 用于指针跳转 默认取所选块1/2处; 若1/2处在视频轨道外 则取视频轨道长度处
          if (duration > this.trackDuration) {
            duration = this.trackDuration
          }
          this.handleSelectedClick(e, index, target, trackIndex)
          // 更新指针数据
          this.updatePointerData(duration, false)
          this.$refs.pointer.judgePlayingTarget()
          // 设置activev-drr
          this.$store.commit('updateValue', { name: 'activeName', value: active })
        }
      })
    },
    handleIconAdd (name, target) {
      // icon-add 添加素材到轨道
      const targetName = name
      const targetList = name + 'TrackList'
      const playingTarget = 'playing' + name.slice(0, 1).toUpperCase() + name.slice(1)
      const params = {
        name: targetName,
        list: targetList
      }
      // 获取playing-
      this.$refs.pointer.judgePlaying(params)

      // 获取对应情况下的属性
      const realTarget = Object.assign({}, target)
      if (!realTarget.duration) {
        // 处理没有初始时长的对象
        realTarget.duration = this.trackScale
      }
      realTarget.positionXBegin = this[playingTarget][0] && this[playingTarget][0].positionXEnd ? this[playingTarget][0].positionXEnd : this.pointerLeft
      realTarget.positionXEnd = realTarget.positionXBegin + realTarget.duration * this.trackScale

      // 获取对应情况下 pointer现对应的index 用于后续插入与排序
      let newIndex = this[playingTarget + 'Index'][0]
      if (!this[playingTarget][0] || !this[playingTarget][0].positionXEnd) {
        const index = this[targetList][0].reduce((result, item, index) => {
          if (this.pointerLeft >= item.positionXEnd) {
            result = index
          }
          return result
        }, -1)
        newIndex = index
      }
      // 添加
      this.$store.commit('tabDragAdd', {
        target: realTarget,
        index: newIndex,
        targetTrackIndex: 0,
        list: targetList,
        prefix: name,
        trackId: name + 'Track',
        iconAdd: true,
        vm: this
      })
    },
    handleCancelEdit (trackIndex) {
      // 退出处于编辑状态的text-drr
      this.$refs.textDrr[trackIndex].handleDrrTextEditEnd()
    },
    beginMediaClip () {
      // 轨道视频选择块裁剪 - 数据修改与添加
      const selected = this.selected
      const media = { ...this.selectedTarget }
      const left = this.realLeft
      const index = selected.index
      let oldMedia = this.materialTrackList[selected.index]

      // 修改新轨道块1的结束时间 - 应为指针所在时间
      const oldEndTime = media.startTime + this.getDurationByWidth(left)
      this.$store.commit('updateArrayObjectAttr', { name: 'materialTrackList', index: index, attr: 'trackEndTime', value: this.pointerDuration })
      this.$store.commit('updateArrayObjectAttr', { name: 'materialTrackList', index: index, attr: 'endTime', value: oldEndTime })

      // 设置新轨道块2的属性 并设置正确开始时间
      const newMedia = { ...media, trackStartTime: oldMedia.trackEndTime, startTime: oldMedia.endTime }
      this.updatePointerData(newMedia.trackStartTime, false)

      // 添加新轨道块2到轨道数据中
      this.$store.commit('updateArrayAdd', { name: 'materialTrackList', index: selected.index + 1, value: newMedia })
    },
    finishMediaClip () {
      // 轨道视频选择块裁剪 - 轨道块绘制
      const index = this.selected.index
      let clipOne = document.getElementById('clip' + index)

      // 设置新轨道块1的样式
      clipOne.style.width = this.realLeft + 'px'

      // 在数据更新后进行绘制
      this.$nextTick(() => {
        for (let i = this.materialTrackList.length - 1; i > index + 1; i--) {
          // 因为数据改变的关系 后半部分会重新渲染 所以需要重新绘制
          let before = document.getElementById('clip' + (i - 1))
          let after = document.getElementById('clip' + i)
          after.style = `
            width: ${before.style.width};
            height: ${before.style.height};
            background-image: ${before.style.backgroundImage};
            background-size: auto 100%
          `
        }

        // 单独设置新轨道块2的样式
        let clipTwo = document.getElementById('clip' + (index + 1))
        clipTwo.style = `
          width: ${this.selected.width - this.realLeft}px;
          height: ${this.defaultMaterialHeight}px;
          background-image: ${this.selected.dataURL};
          background-size: auto 100%;
        `

        // 更新转场
        // this.$store.commit('updateValue', { name: 'operationName', value: 'clip' })
        // this.$store.commit('updateValue', { name: 'operationIndex', value: this.selected.index })
        // 完成剪辑后 默认选中新轨道块2
        this.handleSelectedClick(clipTwo, index + 1, 'materialTrackList')

        // 避免原地暂停后播放有重复帧显示
        this.$refs.pointer.judgePlayingTarget()
      })
    },
    setPointerAndTrack (left, pointerDuration) {
      // 记录指针位置与轨道播放位置
      this.$store.commit('updatePointer', { pointerLeft: left, pointerDuration: pointerDuration })
      this.trackCurrentTime = formatDuration(pointerDuration)
      if (left === 0) {
        this.judgeVideoSource(this.materialTrackList[0], 0)
      }
    },
    judgeVideoSource (playingMaterial, index) {
      this.playingIndex = index
      // 判断当前播放的地址及currentTime
      if (!playingMaterial) {
        // 无播放对象 清空播放区域视频地址
        this.videoSrc = ''
        return false
      }

      const lastPlayedMedia = Object.assign({}, this.playingMaterial)
      let tempLeft = this.pointerDuration - playingMaterial.trackStartTime
      this.$store.commit('updatePlayingTarget', { target: 'playingMaterial', value: playingMaterial, index: undefined })

      // 视频不在播放中, 指针在手动移动时
      if (!this.videoPlay) {
        // console.log('视频不在播放中, 指针在手动移动时')
        this.videoSrc = playingMaterial.playUrl
        this.videoTarget.src = playingMaterial.playUrl
        this.videoTarget.currentTime = playingMaterial.startTime + tempLeft
        this.drawCanvasVideoCover(playingMaterial.startTime + tempLeft)
        return 1
      }
      // 视频播放时, 素材改变 需要换源
      const judgeChangeSrc = playingMaterial.playUrl !== lastPlayedMedia.playUrl
      if (judgeChangeSrc) {
        // console.log('视频播放时, 素材改变 需要换源')
        this.videoSrc = playingMaterial.playUrl
        this.videoTarget.src = playingMaterial.playUrl
        this.videoTarget.currentTime = playingMaterial.startTime + tempLeft
        this.handleVideoPlay()
      }
      // 视频播放时, 素材不变 无需换源
      const judgeChangeCurrentTime = (playingMaterial.playUrl === lastPlayedMedia.playUrl) && (playingMaterial.trackStartTime !== lastPlayedMedia.trackStartTime)
      if (judgeChangeCurrentTime) {
        // console.log('视频播放时, 素材不变 无需换源')
        this.videoTarget.currentTime = playingMaterial.startTime + tempLeft
      }
    },
    judgePictureSource (targetList, indexList) {
      // 判断当前播放的picture, 若为视频贴图 还需获得currentTime
      const last = this.playingPicture[0]
      if (last) {
        const judgeResult = targetList[0] && targetList[0].title === last.title && targetList[0].trackStartTime === last.trackStartTime
        if (!this.videoPlay && judgeResult) {
          // playing-没变 并且不在播放中时: 设置当前视频贴图应在的时间并跳转显示
          this.playVideoPicture(targetList[0], false)
        }
      }
      // playing-改变 重新赋值 并关闭activeDrr及对应操作页
      if (!this.judgePlayingChange('playingPictureIndex', indexList)) {
        this.$store.commit('updateValue', { name: 'activeName', value: null })
        this.$store.commit('updatePlayingTarget', { target: 'playingPicture', value: targetList, index: indexList })
      }
    },
    judgeTextSource (targetList, indexList) {
      // 判断当前播放的text
      if (!this.judgePlayingChange('playingTextIndex', indexList)) {
        // playing-改变 重新赋值 并关闭activeDrr及对应操作页
        this.$store.commit('updateValue', { name: 'activeName', value: null })
        this.$store.commit('updatePlayingTarget', { target: 'playingText', value: targetList, index: indexList })
      }
    },
    judgeTransitionSource (target) {
      // 判断当前播放的transition
      this.$store.commit('updatePlayingTarget', { target: 'playingTransition', value: target, index: undefined })
    },
    judgePlayingChange (oldList, newList) {
      // 判断playing-是否改变
      return JSON.stringify(this[oldList]) === JSON.stringify(newList)
    },
    playVideoPicture (picture, isNeedPlay) {
      // 播放视频贴图
      this.$nextTick(() => {
        let videoPicture = this.$refs.pictureDrr[0].$refs.drrTarget[0]
        videoPicture.currentTime = this.pointerDuration - picture.trackStartTime
        this.$store.commit('drrElementData', { way: false, index: this.playingPictureIndex[0], playingName: 'playingPicture', vm: this.$refs.pictureDrr[0] })
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
    changePointerStart (duration) {
      // 时间轴对指针的控制 - 点击时间轴 指针可对应跳转与拖拽
      this.handleVideoPause()
      this.updatePointerData(duration, false)
      this.$refs.pointer.judgePlayingTarget()
    },
    getUlTop () {
      let length = 0
      switch (this.ulName) {
        case 'text':
          break
        case 'picture':
          length = this.textTrackList.length
          break
        case 'material':
          length = this.textTrackList.length + this.pictureTrackList.length
          break
        case 'music':
          length = this.textTrackList.length + this.pictureTrackList.length + this.materialTrackList.length
          break
      }
      return (this.showUlIndex + length) * 40
    },
    getDurationByWidth (width) {
      // 根据宽度与时长的比例计算 获取时长
      return width / this.trackScale
    },
    getReverseIndex (index, length) {
      // 获得数组反转后原index对应的现index
      return length - 1 + index + index * (-2)
    },
    updatePointerData (duration, isplaying) {
      // 更新指针相关数据
      let realDuration = duration
      if (duration < 0) {
        realDuration = 0
      }

      const left = realDuration * this.trackScale

      this.trackCurrentTime = formatDuration(realDuration)
      this.$store.commit('updatePointer', { pointerLeft: left, pointerDuration: realDuration })
      if (isplaying) {
        this.$refs.pointer.moveWhenVideoPlay(realDuration)
      } else {
        this.$refs.pointer.changePointerLeft(left)
      }
    },
    initTrack () {
      // 初始化视频素材轨道及播放区域数据
      this.$nextTick(() => {
        const count = this.materialTrackList.length
        let list = this.materialTrackList
        for (let i = 0; i < count; i++) {
          let target = document.querySelector('#clip' + i)
          let trackDuration = list[i].trackEndTime - list[i].trackStartTime
          // 初始化样式：宽高 位置 背景图
          target.style = `
            width: ${trackDuration * this.trackScale}px;
            height: ${this.defaultMaterialHeight}px;
            left: ${list[i].trackStartTime * this.trackScale}px;
            background-image: url(${list[i].cover});
            background-size: auto 100%;
          `
        }

        this.videoSrc = list[0].playUrl
        this.videoTarget.currentTime = list[0].startTime

        this.$store.commit('updateValue', { name: 'materialTrackWidth', value: this.materialTrackWidth + list[count - 1].trackEndTime * this.trackScale })
        this.handleSelectedClick(document.querySelector('#clip0'), 0, 'materialTrackList')
      })
    },
    videoTimeUpdateMonitor (e) {
      // 监听 - 视频区域播放
      let video = e.target
      if (!this.videoPlay) {
        return false
      }
      // 获取playing-
      this.$refs.pointer.judgePlayingTarget()
      const trackStartTime = this.playingMaterial.trackStartTime
      const startTime = this.playingMaterial.startTime
      const lastMedia = this.materialTrackList[this.materialTrackList.length - 1]
      // 纠正currentTime
      if (video.currentTime < startTime) {
        video.currentTime = startTime
      }
      // 获取现在的播放位置(轨道时间)
      const wholeTime = video.currentTime + trackStartTime - startTime
      // 判断是否已播放至视频轨道末尾
      const judgeTrackLast = Math.round(wholeTime) >= Math.round(lastMedia.trackEndTime)
      if (judgeTrackLast) {
        // 已播放至视频轨道末尾
        this.realLeft = 0
        // 最后一秒也要显示
        this.updatePointerData(wholeTime, true)
        // 再从头开始播放
        this.updatePointerData(0, true)
        video.currentTime = startTime
        setTimeout(() => {
          video.play()
        }, 150)
      } else {
        // 未播放至轨道末尾
        this.realLeft = (this.pointerDuration - trackStartTime) * this.trackScale
        this.updatePointerData(wholeTime, true)
      }
    },
    keyUpMonitor (e) {
      // 监听 - 键盘回弹
      this.keyCode = null
      // delete backspace 均可删除选择块
      const deleteCode = e.keyCode === 46 || e.keyCode === 8
      // isInputting：输入框焦点状态 避免在输入框删除时误删选择块
      // 选择块删除条件: 没有处于输入/编辑状态的内容 没有打开保存/提交剪辑弹窗 没有打开添加素材弹窗
      if (deleteCode && !this.isInputting && !this.isTextEdit && !this.isSaveOrSubmit && !this.isShowMaterialAdd) {
        switch (this.selected.type) {
          case 'materialTrackList':
            this.handleMediaDelete()
            break
          case 'pictureTrackList':
            // 有drr的选择块类型 需退出drr激活状态再进行删除
            this.$store.commit('updateValue', { name: 'activeName', value: null })
            this.$store.commit('trackBlockDelete', { trackId: 'pictureTrack', prefix: 'picture', vm: this })
            break
          case 'textTrackList':
            this.$store.commit('updateValue', { name: 'activeName', value: null })
            this.$store.commit('trackBlockDelete', { trackId: 'textTrack', prefix: 'text', vm: this })
            break
        }
      }
      // space 控制播放区域的播放/暂停
      // 控制条件: 处于在线剪辑页面 没有处于编辑状态的内容 没有打开保存/提交剪辑弹窗 没有打开素材添加弹窗
      if (e.keyCode === 32 && !this.isTextEdit && !this.isSaveOrSubmit && !this.isShowMaterialAdd) {
        this.handleVideoPlayOrPause()
      }
    },
    keyDownMonitor (e) {
      // 监听 - 键盘按下
      this.keyCode = e.keyCode

      // 阻止浏览器默认行为 - 空格滚动
      if (e.keyCode === 32) {
        e.preventDefault()
      }
    },
    mouseDownMonitor (e) {
      // 监听 - 鼠标点击 - 进行drr焦点/激活操作
      // 进行drr焦点操作的条件：没有打开保存/提交剪辑弹窗 没有打开添加素材弹窗
      if (this.isSaveOrSubmit || this.isShowMaterialAdd) {
        return true
      }
      // 记录输入框焦点状态 避免在输入框删除时误删选择块
      this.isInputting = false
      const inputTarget = e.target.nodeName === 'INPUT'
      if (inputTarget) {
        this.isInputting = true
      }

      // 获取正在焦点的drr
      let drrTarget = null
      let name = null
      switch (this.activeName) {
        case 'picture':
          drrTarget = 'pictureDrr'
          name = 'picture'
          break
        case 'text':
          drrTarget = 'textDrr'
          name = 'text'
          break
      }
      // 无焦点的drr 不操作
      if (!drrTarget) {
        return true
      }
      // 在操作标签页区域操作时 保留句柄 激活drr, 否则取消drr激活状态
      const clientX = e.clientX
      const clientY = e.clientY
      const positionRect = this.$refs.tabsCol.$el.getBoundingClientRect()
      const inWidthRange = clientX > 0 && clientX < positionRect.width
      const inHeightRange = clientY > this.titleHeight && clientY < positionRect.height + positionRect.top + this.titleHeight
      if ((inWidthRange && inHeightRange) || this.isTextEdit) {
        // 获取正在操作的drr
        const targetId = drrTarget + this.selected.trackIndex
        switch (name) {
          case 'picture':
            // 保留句柄
            this.$refs[drrTarget][0].$refs.resizable[0].enabled = true
            break
          case 'text': {
            const drr = this.$refs[drrTarget].find(item => {
              return item.$el.id === targetId
            })
            // 保留句柄
            drr.$refs.resizable[0].enabled = true
            break
          }
        }
        // 激活对应drr
        this.$store.commit('updateValue', { name: 'activeName', value: name })
      } else {
        // 退出drr的激活状态
        this.$store.commit('updateValue', { name: 'activeName', value: null })
      }
    },
    windowResizeMonitor () {
      // 监听 - 窗口缩放
      // 窗口缩放处理条件 - 没有打开保存/提交剪辑弹窗
      if (this.isSaveOrSubmit) {
        return true
      }
      // 获取图标列表的宽度 用于轨道ul的定位
      this.iconWidth = window.innerWidth * 0.04
      const frameWidth = this.$refs.videoFrame.clientWidth
      const proportion = this.videoFrame.width ? frameWidth / this.videoFrame.width : frameWidth / 1280
      if (this.videoFrame.width === null) {
        // 保存初始播放区域大小
        this.$store.commit('initProportion', frameWidth)
      }
      // 播放区域按照比例缩放
      this.videoFrame.width = frameWidth
      this.videoFrame.height = frameWidth * 720 / 1280
      // 同步素材tabs的高度
      // document.querySelector('.online-clip-tabs .el-tabs__content').style.height = this.videoFrame.height + 'px'
      // 更新播放区域高度
      this.$refs.videoFrame.style.height = this.videoFrame.height + 'px'
      // 更新播放区域比例数值
      this.$store.commit('updateDrrResolution', { proportion: proportion, width: frameWidth, vm: this })
    },
    axisYScrollMonitor (e) {
      // 监听 - 轨道区域的Y轴滚动
      const top = e.target.scrollTop
      // 获得现在轨道区域总高度：字幕贴图轨道数*高度 + 视频轨道高度 + 暂未开发的音频轨高度
      const totalHeight = (this.textTrackList.length + this.pictureTrackList.length) * 40 + 65 + 40 + 15
      // 如果目前已到底 不再允许下滑
      if (top + 200 >= totalHeight) {
        return false
      }
      // 更新一些需要保持相对静止元素的样式
      this.$refs.timeAxis.$el.style.transform = `translateY(${top}px)`
      this.$refs.emptyIcon.style.transform = `translateY(${top}px)`
      this.$refs.clipResourceIcons.$el.style.transform = `translateY(-${top}px)`
      this.$refs.pointer.handlePointerYStatic(top)
    },
    stopCanvasVideo () {
      clearInterval(this.canvasTimer)
    },
    drawCanvasVideoCover (time) {
      // 绘制一帧视频
      let canvasVideo = this.canvasVideo
      let video = this.videoTarget
      video.currentTime = time
      this.isLoadingVideo = true
      video.oncanplay = () => {
        // if (this.playingTransition) {
        //   video.oncanplay = null
        // }
        canvasVideo.width = this.videoFrame.width * 2
        canvasVideo.height = this.videoFrame.height * 2
        canvasVideo.getContext('2d').drawImage(video, 0, 0, canvasVideo.width, canvasVideo.height)
        this.isLoadingVideo = false
      }
    },
    drawCanvasVideo () {
      // 绘制视频
      let canvasVideo = this.canvasVideo
      let video = this.videoTarget
      // let videoTransition = this.$refs.videoTransition
      let ctx = canvasVideo.getContext('2d')
      canvasVideo.width = this.videoFrame.width * 2
      canvasVideo.height = this.videoFrame.height * 2
      this.canvasTimer = setInterval(() => {
        ctx.drawImage(video, 0, 0, canvasVideo.width, canvasVideo.height)
        // if (this.playingTransition) {
        //   ctx.drawImage(videoTransition, 0, 0, canvasVideo.width, canvasVideo.height)
        // }
      }, 40)
    },
    startGuider () {
      // 打开引导
      this.$driver.defineSteps(steps)
      this.$driver.start()
    }
  },
  created () {
    this.isClipLoading = true
    const list = [
      { rlsId: '', editId: '', seq: '', status: 1, id: 319183, coocaaMId: '6uh9j6l00400', coocaaVId: 'r9mtl000000', thirdMovieId: 'o0032tld90n', thirdVideoId: 'm441e3rjq9kwpsc', duration: 5, frameDuration: 5, formattedDuration: '00:00:05', videoTitle: 'Firework', playUrl: require('@/assets/video/firework.mp4'), cover: require('@/assets/material1004.png'), modifyTime: '2020-12-19 04:53:07', source: 'tencent', businessType: 0, businessName: '影视', categoryId: 2, categoryName: '动漫', startFrame: 0, endFrame: 5, startTime: 0, endTime: 5 },
      { rlsId: '', editId: '', seq: '', status: 1, id: 319185, coocaaMId: '6uh9j6l00402', coocaaVId: 'r9mtl000002', thirdMovieId: 'o0032tld92n', thirdVideoId: 'm441e3rjq7kwpsc', duration: 15, frameDuration: 15, formattedDuration: '00:00:15', videoTitle: 'SunsetGlow', playUrl: require('@/assets/video/sunsetGlow.mp4'), cover: require('@/assets/material1004.png'), modifyTime: '2020-12-19 04:53:07', source: 'tencent', businessType: 0, businessName: '影视', categoryId: 2, categoryName: '动漫', startFrame: 0, endFrame: 15, startTime: 0, endTime: 15 },
      { rlsId: '', editId: '', seq: '', status: 1, id: 319184, coocaaMId: '6uh9j6l00401', coocaaVId: 'r9mtl000001', thirdMovieId: 'o0032tld91n', thirdVideoId: 'm441e3rjq8kwpsc', duration: 315, frameDuration: 315, formattedDuration: '00:05:15', videoTitle: 'JX3', playUrl: require('@/assets/video/JX3.mp4'), cover: require('@/assets/material1004.png'), modifyTime: '2020-12-19 04:53:07', source: 'tencent', businessType: 0, businessName: '影视', categoryId: 2, categoryName: '动漫', startFrame: 0, endFrame: 315, startTime: 0, endTime: 315 }
    ]
    this.$store.commit('updateArrayRevalue', { name: 'materialTabList', value: list })
  },
  mounted () {
    window.addEventListener('keyup', this.keyUpMonitor)
    window.addEventListener('keydown', this.keyDownMonitor)
    window.addEventListener('mousedown', this.mouseDownMonitor)
    window.addEventListener('resize', this.windowResizeMonitor)
    // 初始化drag的替代透明图
    this.$store.commit('initDragImage')
    this.$nextTick(() => {
      // 获取窗口初始化数值
      this.windowResizeMonitor()
      this.canvasVideo = this.$refs.canvasVideo
      this.videoTarget = this.$refs.video
      this.clipResource = this.$refs.clipResource.$el
      this.clipResource.addEventListener('scroll', this.axisYScrollMonitor)
      this.videoTarget.addEventListener('timeupdate', this.videoTimeUpdateMonitor)
      this.videoTarget.addEventListener('play', this.drawCanvasVideo)
      this.videoTarget.addEventListener('pause', this.stopCanvasVideo)
      setTimeout(() => {
        // 关闭加载动画
        this.isClipLoading = false
        // 打开引导
        this.startGuider()
      }, 500)
    })
  },
  beforeDestroy () {
    clearInterval(this.canvasTimer)
    this.canvasTimer = null
    window.removeEventListener('keyup', this.keyUpMonitor)
    window.removeEventListener('keydown', this.keyDownMonitor)
    window.removeEventListener('mousedown', this.mouseDownMonitor)
    window.removeEventListener('resize', this.windowResizeMonitor)
    this.clipResource.removeEventListener('scroll', this.axisYScrollMonitor)
    this.videoTarget.removeEventListener('timeupdate', this.videoTimeUpdateMonitor)
    this.videoTarget.removeEventListener('play', this.drawCanvasVideo)
    this.videoTarget.removeEventListener('pause', this.stopCanvasVideo)
  }
}
</script>
<style lang="stylus" scoped>
.online-clip
  text-align left
  user-select none // 禁止用户的选中行为
.main-area
.operations-area
.axis-area
  min-width 1310px
.main-area
  margin-top 0px !important
  min-height 58vh
  .material-area
    margin-top 0px
.diy-icon-t
  &:hover
    color #26CB51
.controls-duration
  display inline-block
  position absolute
  top 10px
  left 4vw
  font-size 14px
  color #ccc
.operations-area
  position relative
  height 40px
  box-shadow #128430 0px -1px
.operations-convenient
  display inline-block
  position absolute
  bottom 5px
  left 0px
  margin-left 15px
  vertical-align super
  i
    color #606266
    margin-right 20px
    font-size 20px
.custom-i-hover
  &:hover,
  &:focus
    color #606266
.transition-alert
  position absolute
  left 100px
  width 520px
  >>>.el-alert__closebtn
    top 10px
    font-size 12px
    color #D0BDA2
.operations-save
  position absolute
  bottom 5px
  right 0px
  font-size 13px
  color #888
  span
    vertical-align bottom
.save-my-works
  margin-left 10px
  width 120px
.save-clip
  margin-left 15px
  width 100px
.save-my-works, .save-clip
  height 30px
  padding 5px
  font-size 13px
  color #fff
  border 0px
  background #26CB51
  &:hover,
  &:focus
    color #fff
    border 0px
    background #18d747
.axis-area
  height 235px
  overflow hidden
.clip-resource-icons
  position relative
  margin-top 10px
  text-align center
  font-size 18px
.empty-icon
  width 100%
  height 25px
  background #000000
.multi-tracks-ul
  position absolute
  left 4.16667% // 紧贴图标列表
  border-radius 5px
  box-shadow 1px 1px 5px 1px #AAAAAA
  background #FFFFFF
  z-index 6
.track-type-icon
  display block
  height 40px
  line-height 40px
  color #606266
.el-icon-video-camera
  height 65px
  line-height 65px
.clip-resource
  position relative
  height 235px
  overflow auto
  .time-axis
    margin 0px 0px 10px
    position relative
    z-index 2
.pointer-style
  position relative
.tracks-container
  overflow-x auto
.video-cols
  position relative
  padding 0px !important
  height 55vh
  text-align center
.info-icon-area
  position absolute
  top 20px
  right 0px
  i
    margin-right 10px
    font-size 18px
.video-frame
  position relative
  top 15%
  width 100%
.video-controls
  position relative
  top 15%
  padding-top 10px
  width 100%
.video-frame,
.video-controls
  background #1C1D1C
.canvas-video
  position absolute
  top 0px
  left 0px
  width 100%
  height 100%
  transform-origin 0 0
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
.video-track
  text-align left
.editable-target
  height 55px
  video
    height 55px
</style>
<style lang="stylus" scoped>
.clip-resource
  >>>.el-row:not(.time-axis)
    margin-top 0px
    margin-bottom 10px
    height 30px
    background #1c1d1c
  .video-track
    position relative
    height 55px !important
>>>.el-tabs__header
  margin 0px
  padding 0px 2px
  height 0px
  .el-tabs__item
    margin 0px 15px
    padding 0px
    font-weight 400
    color #888
    &.is-active,
    &:hover,
    &:focus
      color #26CB51
  .el-tabs__item.is-top:nth-child(2)
    padding-left 0px
  .el-tabs__item.is-top:last-child
    padding-right 0px
  .el-tabs__nav-wrap 
    padding-top 10px
    box-shadow #128430 0px 1px
  .el-tabs__nav-wrap::after
    height 0px
  .el-tabs__active-bar
    display none
.online-clip-tabs
  height 100%
  >>>.el-tabs__content
    height 55vh
>>>.el-tabs__content
  padding 10px
  height 80%
  overflow inherit
  .el-tab-pane
    position relative
    margin-top 50px
    height 90%
>>>.el-row
  margin 0px
  margin-top 10px
.controls-icons
  >>>.el-image
    width 18px
    height 18px
    cursor pointer
.el-dialog__wrapper
  overflow hidden
.add-material-dialog
  overflow-y auto
  >>>.el-dialog__body
    padding 10px 20px
</style>
