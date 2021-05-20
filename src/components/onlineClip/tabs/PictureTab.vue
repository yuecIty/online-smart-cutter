<template>
  <div class="picture-tab">
    <!-- 贴图列表页 -->
    <div v-show="activeName !== 'picture'" class="picture-container">
      <div v-if="!isShowLocal" class="category-container">
        <div>
          <!-- 一级检索目录 -->
          <div
            v-for="first in firstCategoryList"
            :key="first.id"
            :class="{
              'category-style': true,
              'category-active': firstCategory.categoryId === first.categoryId
            }"
            @click="handleSecondCategorySearch(first)"
          >{{ first.categoryName }}</div>
        </div>
        <div>
          <!-- 二级检索目录 -->
          <div
            v-for="second in secondCategoryList"
            :key="second.id"
            :class="{
              'category-style': true,
              'category-active': secondCategory.categoryId === second.categoryId
            }"
            @click="handlePictureSearch(second)"
          >{{ second.categoryName }}</div>
        </div>
      </div>
      <!-- 贴图列表内容 -->
      <div
        v-if="isShowLocal ? pictureFileList.length !== 0 : !isEmpty"
        v-loading="isPictureLoading"
        v-infinite-scroll="handlePictureMore"
        :infinite-scroll-delay="300"
        :infinite-scroll-distance="10"
        :class="{
          'picture-list': true,
          'local-picture-list': isShowLocal
        }"
        style="overflow-y: scroll"
      >
        <div
          v-for="(item, index) in isShowLocal ? pictureFileList : pictureList.slice(0, picShowAmount)"
          :key="item.picId"
          class="picture-style"
          @mouseenter="handlePictureOver(index, item)"
          @mouseleave="handlePictureOut"
          @mousedown="judgePictureDraggable(item)"
        >
          <i
            v-show="mouseTarget === index"
            class="el-icon-circle-plus-outline picture-plus-icon"
            title="添加"
            @click="handlePictureIconAdd(item)"
          ></i>
          <i
            v-show="mouseTarget === index && isShowLocal"
            class="el-icon-delete picture-delete-icon"
            title="删除"
            @click="handleLocalPictureDelete(index)"
          ></i>
          <el-image
            fit="contain"
            lazy
            :src="item.picUrl"
            :draggable="materialTrackList.length !== 0 && !!item.duration"
            @dragstart="handlePictureStart({
              e: $event,
              item: item,
              index: index,
              list: 'pictureTrackList',
              prefix: 'picture',
              trackId: 'pictureTrack',
              isTrackDrag: false
            })"
            @drag="handlePictureDragging"
            @dragend="handlePictureDragEnd"
          >
            <el-image slot="error" fit="contain" :src="loadingImage"></el-image>
          </el-image>
        </div>
      </div>
      <div v-else class="picture-empty">
        <span>暂无贴图</span>
      </div>
      <!-- 贴图本地上传功能 -->
      <div class="button-style">
        <el-upload
          class="location-upload"
          accept=".png"
          :action="uploadAction"
          :disabled="isPictureUploading"
          :multiple="false"
          :show-file-list="false"
          :before-upload="judgeUploadType"
          :on-success="handleUploadSuccess"
        >
          <el-button class="methods-button" :disabled="isPictureUploading">
            <span v-show="!isPictureUploading">本地上传</span>
            <!-- 贴图上传时的显示动画 -->
            <Loading v-show="isPictureUploading" color="#26CB51" :type="2"></Loading>
          </el-button>
        </el-upload>
        <span class="message"> *本地上传功能开发中</span>
        <!-- <span class="message"> 本地仅支持上传PNG格式贴图</span> -->
      </div>
      <!-- 贴图列表左下角图标 用于切换在线贴图与本地贴图显示 -->
      <div class="picture-icons">
        <i
          :class="{
            'el-icon-menu': true,
            'active-picture-list': !isShowLocal
          }"
          @click="handleNetworkPictureShow"
        ></i>
        <i
          :class="{
            'el-icon-upload': true,
            'active-picture-list': isShowLocal
          }"
          @click="handleLocalPictureShow"
        ></i>
      </div>
    </div>
    <!-- 贴图列表的鼠标悬停预览 -->
    <el-card v-show="isShowCard" v-loading="isCardLoading" class="picture-card">
      <el-image
        v-if="cardType === 'picture'"
        fit="contain"
        :src="cardSrc"
        @load="loadedCardContent"
      ></el-image>
      <video v-if="cardType === 'video'" loop muted autoplay :src="cardSrc" @canplaythrough="loadedCardContent"></video>
    </el-card>
    <!-- 贴图操作页 -->
    <div
      v-show="activeName === 'picture'"
      class="operation-tab"
    >
      <div>
        <span>旋转</span>
        <el-slider
          v-model="tabRotate"
          class="operation-area"
          :show-input="true"
          :show-tooltip="false"
          :min="0"
          :max="360"
        ></el-slider>
      </div>
      <div>
        <span>缩放</span>
        <el-slider
          v-model="tabResize"
          class="operation-area"
          id="resize-button"
          :show-input="true"
          :show-tooltip="false"
          :min="0"
          :max="2"
          :step="0.01"
          @mousedown.native="beforePictureResize"
        ></el-slider>
      </div>
      <div>
        <span>透明度</span>
        <el-slider
          v-model="tabOpacity"
          class="operation-area"
          :show-input="true"
          :show-tooltip="false"
          :min="0"
          :max="1"
          :step="0.1"
        ></el-slider>
      </div>
      <div>
        <span>翻转</span>
        <div class="operation-area">
          <i
            :class="{
              'el-icon-d-caret': true,
              'icon-ban': flip.h
            }"
            @click="handlePictureFlip('X')"
          ></i>
          <i
            :class="{
              'el-icon-d-caret': true,
              'horizontal-icon': true,
              'icon-ban': flip.v
            }"
            @click="handlePictureFlip('Y')"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Loading from '../Loading'
import { mapState, mapMutations } from 'vuex'
export default {
  components: {
    Loading
  },
  props: {
    tabName: { // 当前选择的素材tabs 可能的值: materialTab pictureTab textTab……
      type: String,
      default: null
    }
  },
  data () {
    return {
      mouseTarget: null,
      firstCategory: {},
      secondCategory: {},
      firstCategoryList: [],
      secondCategoryList: [],
      pictureList: [
        { modifyTime: '2021-01-18 15:28:56', thirdId: '1', createdTime: '2021-01-18 15:28:56', picUrl: require('@/assets/picture/circle.jpg'), fileUrl: require('@/assets/video/circle.webm'), title: 'Circle', categoryId:129, fileType: 'video', picId:1, status:1 },
        { modifyTime: '2021-01-18 15:28:56', thirdId: '2', createdTime: '2021-01-18 15:28:56', picUrl: require('@/assets/picture/line.jpg'), fileUrl: require('@/assets/video/line.webm'), title: 'Line', categoryId:128, fileType: 'video', picId:2, status:1 },
        { modifyTime: '2021-01-18 15:28:56', thirdId: '3', createdTime: '2021-01-18 15:28:56', picUrl: require('@/assets/picture/forest.jpg'), fileUrl: require('@/assets/picture/forest.jpg'), title: 'Forest', categoryId:127, fileType: 'picture', picId:3, status:1 },
        { modifyTime: '2021-01-18 15:28:56', thirdId: '4', createdTime: '2021-01-18 15:28:56', picUrl: require('@/assets/picture/snow.jpg'), fileUrl: require('@/assets/picture/snow.jpg'), title: 'Snow', categoryId:126, fileType: 'picture', picId:4, status:1 }
      ],
      pictureFileList: [],
      picShowAmount: 80,
      isListChange: true,
      isEmpty: false,
      isPictureLoading: false,
      isShowLocal: false,
      cardSrc: '',
      cardType: '',
      isCardLoading: false,
      tabRotate: 0,
      tabResize: 1,
      tabOpacity: 1,
      pagination: {
        currentPage: 1,
        pageSize: 20
      },
      flip: {
        v: false,
        h: false
      },
      loadingImage: require('@/assets/material1004.png'),
      isShowCard: false,
      uploadAction: '',
      // 关闭接口
      // uploadAction: 'api/uploadHomeImgV2.html'
    }
  },
  computed: {
    ...mapState({
      activeName: state => state.activeName,
      isPictureUploading: state => state.isPictureUploading,
      selected: state => state.selected,
      selectedTarget: state => state.selectedTarget,
      playingPicture: state => state.playingPicture,
      playingPictureIndex: state => state.playingPictureIndex,
      materialTrackList: state => state.materialTrackList,
      pictureTrackList: state => state.pictureTrackList
    })
  },
  watch: {
    activeName: function (val) {
      // 监听 - 当前激活的drr类型
      if (!val && this.tabName === 'pictureTab') {
        // 当激活的activeName为空 且 当前tabs为贴图时
        this.$nextTick(() => {
          // 修复贴图列表未加载完成就打开操作页所导致的列表图片加载中问题
          const target = document.querySelector('.picture-list')
          if (target) {
            document.querySelector('.picture-list').scrollTop++
          }
        })
      }
    },
    selectedTarget: function (val) {
      // 若当前选择块为贴图类型 则操作标签页需根据当前值显示数据
      if (!val || !this.selected.type || this.activeName !== 'picture') {
        return true
      }
      this.initTab(val)
    },
    'selectedTarget.whirl': function (angle) {
      // 若当前选择块为贴图类型 且用户在播放区域的drr进行旋转操作 则操作标签页的旋转数值也需同步
      let realRotate = angle
      // 需要对数值进行显示的规范化
      if (angle > 360) {
        realRotate = angle - 360
      }
      if (angle < 0) {
        realRotate = angle + 360
      }
      this.tabRotate = realRotate
    },
    tabRotate: function (val) {
      if (!this.selectedTarget || val === this.selectedTarget.whirl) {
        return false
      }
      // 旋转滑块移动 数值改变 录入最新数值
      this.$store.commit('drrTabRotate', val)
    },
    tabResize: function (val) {
      if (!this.selectedTarget || val === this.selectedTarget.scale) {
        return false
      }
      // 缩放滑块移动 数值改变 录入最新数值
      this.$store.commit('drrTabResize', val)
    },
    tabOpacity: function (val) {
      if (!this.selectedTarget || val === this.selectedTarget.transparency) {
        return false
      }
      // 透明度滑块移动 数值改变 录入最新数值
      this.$store.commit('drrTabOpacity', val)
    }
  },
  methods: {
    ...mapMutations({
      handlePictureStart: 'dragStart',
      handlePictureDragging: 'tabDragging',
      handlePictureDragEnd: 'tabDragEnd'
    }),
    beforePictureResize () {
      // 进行缩放操作前 需要获得当前数值下的比例
      this.$store.commit('drrTabBeforeResize', this.tabResize)
    },
    handleSecondCategorySearch () {},
    handlePictureSearch () {},
    // 关闭接口
    // handleSecondCategorySearch (first) {
    //   // 检索二级目录
    //   this.secondCategory = {}
    //   this.pictureList = []
    //   this.isEmpty = false
    //   this.pagination.currentPage = 1
    //   this.firstCategory = first
    //   const params = {
    //     pCategoryId: first.categoryId,
    //     page: 1,
    //     rows: this.pagination.pageSize
    //   }
    //   this.handlePictureSearch(first)
    //   if (first.categoryId === 0) {
    //     // 选择的一级目录为全部 则不需要检索二级目录
    //     this.secondCategoryList = []
    //     return true
    //   }
    //   this.$service.getPictureCategory(params).then(data => {
    //     this.secondCategoryList = [{ id: 0, categoryId: this.firstCategory.categoryId, categoryName: '全部' }].concat(data.rows)
    //   })
    // },
    // handlePictureSearch (second) {
    //   // 检索贴图列表
    //   this.isPictureLoading = true
    //   this.isEmpty = false
    //   this.pagination.currentPage = 1
    //   this.picShowAmount = 80
    //   if (document.querySelector('.picture-list')) {
    //     document.querySelector('.picture-list').scrollTop = 0
    //   }
    //   this.secondCategory = second
    //   let params = {
    //     categoryId: second.categoryId,
    //     page: 1,
    //     rows: this.pagination.pageSize
    //   }
    //   this.$service.getPictureList(params).then(data => {
    //     if (data.total === 0) {
    //       // 若无数据 更新对应状态
    //       this.isEmpty = true
    //     }
    //     if (data.total < params.rows) {
    //       // 若数据量比请求的少 则已获取全部
    //       this.pictureList = data.rows
    //       this.isPictureLoading = false
    //     } else {
    //       // 若数据量比请求的多 则还需获取全部数据
    //       params.rows = data.total
    //       this.$service.getPictureList(params).then(dataAll => {
    //         this.pictureList = dataAll.rows
    //         this.isPictureLoading = false
    //       })
    //     }
    //   })
    // },
    handlePictureMore () {
      // 滚动条触底 自动增加显示
      if (this.picShowAmount < this.pictureList.length) {
        this.picShowAmount += 20
      }
    },
    handlePictureOver (index, item) {
      // 鼠标经过 需唤醒预览
      if (item.loaded) {
        this.isCardLoading = false
      } else {
        this.isCardLoading = true
      }
      this.mouseTarget = index
      this.cardSrc = item.fileUrl
      this.cardType = item.fileType === 'json' ? 'picture' : item.fileType
      this.isShowCard = true
    },
    handlePictureOut () {
      // 鼠标移出 清理相关数据
      this.isCardLoading = false
      this.mouseTarget = null
      this.isShowCard = false
    },
    handlePictureIconAdd (picture) {
      // 添加贴图方式 - 点击列表图标
      if (this.materialTrackList.length === 0 || !picture.duration) {
        return false
      }
      this.$emit('icon-add', 'picture', picture)
    },
    handleLocalPictureDelete (index) {
      // 删除本地贴图 需将缓存内的也删除
      this.pictureFileList.splice(index, 1)
      localStorage.pictureFileList = JSON.stringify(this.pictureFileList)
      this.isShowCard = false
    },
    judgeUploadType (file) {
      // 本地贴图上传前的判断
      if (file.type !== 'image/png') {
        // 文件类型限制
        this.$message({
          message: '仅支持上传png格式贴图',
          type: 'warning'
        })
        return false
      }
      // 已上传限制
      const target = this.pictureFileList.find(item => {
        return file.name.indexOf(item.oldTitle) !== -1
      })
      if (target) {
        this.$message({
          message: '本地贴图中已有同名文件, 请勿重复上传',
          type: 'warning'
        })
        return false
      }
    },
    handleUploadProgress () {
      // 本地贴图上传过程中 对应缓存状态为true
      this.$store.commit('updateValue', { name: 'isPictureUploading', value: true })
    },
    handleUploadSuccess (file) {
      // 本地贴图上传完成 需进行必要的数据处理
      const newPicture = {
        picUrl: file.url,
        fileUrl: file.url,
        oldTitle: file.oldName.split('.')[0],
        // 自定义贴图名
        title: '本地' + (this.pictureFileList.length + 1),
        duration: 10,
        size: file.fileSize,
        fileType: 'picture'
      }
      this.pictureFileList.push(newPicture)
      localStorage.pictureFileList = JSON.stringify(this.pictureFileList)

      // 本地贴图上传结束 对应缓存状态为false
      this.$store.commit('updateValue', { name: 'isPictureUploading', value: false })

      this.$message({
        type: 'success',
        dangerouslyUseHTMLString: true,
        message: '贴图上传成功，请到我的本地上传 -【<i class="el-icon-upload"></i>】中查看'
      })
    },
    handleNetworkPictureShow () {
      // 切换显示在线贴图列表
      if (this.isPictureLoading) {
        // 若贴图列表缓存中 不允许切换
        return false
      }
      this.isShowLocal = false
      this.isListChange = false
      this.isListChange = true
    },
    handleLocalPictureShow () {
      // 切换显示本地贴图列表
      if (this.isPictureLoading) {
        // 若贴图列表缓存中 不允许切换
        return false
      }
      this.isShowLocal = true
      this.isListChange = false
      this.isListChange = true
    },
    handlePictureFlip (way) {
      // 水平翻转与垂直翻转效果不可共存
      if ((way === 'X' && this.flip.h) || (way === 'Y' && this.flip.v)) {
        return false
      }
      if (way === 'X') {
        this.flip.v = !this.flip.v
      }
      if (way === 'Y') {
        this.flip.h = !this.flip.h
      }
      this.$store.commit('drrTabFlip', way)
    },
    judgePictureDraggable (picture) {
      // 判断当前贴图是否可拖拽添加
      if (this.materialTrackList.length === 0) {
        this.$message({
          type: 'warning',
          message: '视频轨道为空，请添加视频素材后再试'
        })
        return false
      }
      if (!picture.duration) {
        this.$message('贴图加载中，右侧预览加载完毕后方可添加')
        return false
      }
      return true
    },
    loadedCardContent (e) {
      // 悬停预览内容加载完毕的相关数据处理
      this.isCardLoading = false
      let targetList = this.isShowLocal ? this.pictureFileList : this.pictureList
      if (e.target.src.indexOf(this.cardSrc) !== -1) {
        // 异步 需要确认结果与请求一致
        const index = targetList.findIndex(item => {
          return this.cardSrc === item.fileUrl
        })
        if (this.cardType === 'video') {
          // 视频贴图 时长为视频时长
          targetList[index].duration = targetList[index].duration ? targetList[index].duration : e.target.duration
        } else {
          // 图片贴图 时长默认为10s
          targetList[index].duration = 10
        }
        // 添加加载完毕状态
        targetList[index].loaded = true
      }
    },
    fetchData () {
      // 关闭接口
      // 获取贴图列表
      // const params = {
      //   pCategoryId: 0,
      //   page: 1,
      //   rows: this.pagination.pageSize
      // }
      // this.$service.getPictureCategory(params).then(data => {
      //   this.firstCategoryList = data.rows
      // })
      // this.handleSecondCategorySearch({ categoryId: 0 })
    },
    initTab (val) {
      // 操作标签页需根据当前对象更新数据
      this.tabRotate = val.whirl
      this.tabResize = val.scale
      this.tabOpacity = val.transparency
      this.flip = {
        v: val.overturn.indexOf('v') !== -1,
        h: val.overturn.indexOf('h') !== -1
      }
    }
  },
  created () {
    // 读取本地上传的贴图
    this.pictureFileList = localStorage.pictureFileList ? JSON.parse(localStorage.pictureFileList) : []
    this.fetchData()
    this.$nextTick(() => {
      if (this.activeName === 'picture') {
        // 若当前激活drr为贴图 则需对应显示操作标签页及对应数据
        this.initTab(this.selectedTarget)
      }
    })
  }
}
</script>
<style lang="stylus" scoped>
.picture-tab
  position relative
  height 100%
  &:focus
    outline 0px
.picture-list
  height 70%
  user-select none // 禁止选中 避免在不允许拖拽的情况下 使用浏览器默认选中行为后再进行拖拽
.local-picture-list
  height auto
.picture-draggable
  width fit-content
  height 100%
  outline 0px
.picture-style
  display inline-block
  position relative
  margin 5px
  width 88px
  height 50px
  border 2px solid #888
  border-radius 5px
  transition all .3s
  &:hover
    color #26CB51
    border-color #26CB51
  .el-image
    width 100%
    height 100%
    border-radius 3px
.picture-plus-icon,
.picture-delete-icon
  position absolute
  top 1px
  font-size 15px
  font-weight 600
  cursor pointer
  z-index 2
.picture-plus-icon
  right 1px
.picture-delete-icon
  left 3px
  color red
.operation-tab
  padding 30px 10px
  span
    display inline-block
    width 10%
    text-align center
    vertical-align super
.operation-area
  display inline-block
  width 85%
  height 50px
  vertical-align middle
  >>>.el-slider__runway
    height 2.5px
    .el-slider__bar
      height 2.5px
    .el-slider__button
      width 10px
      height 10px
.el-icon-d-caret
  margin-right 20px
  vertical-align middle
  font-size 23px
  line-height 35px
  cursor pointer
.horizontal-icon
  transform rotate(90deg)
.icon-ban
  color #ccc
  cursor default
  &:hover
    color #ccc
    cursor default
.picture-card
  position absolute
  top 0px
  right -200px
  width 200px
  height 140px
  background #000000
  border-color #d7d7d7
  z-index 3
  >>>.el-card__body
    position relative
    top 50%
    height inherit
    text-align center
    transform translateY(-50%)
  .el-image
    width 100%
    height 100%
  video
    width 100%
    height 100%
.picture-container
  position relative
  height 100%
  overflow hidden
.category-container
  margin-bottom 0px
.picture-empty
  height 20vh
  line-height 20vh
  font-size 13px
  text-align center
  color #aaa
.button-style
  position absolute
  bottom 0px
  // 避免遮住滚动条
  width 99%
.location-upload
  display inline-block
  margin 10px 3px 3px 3px
.picture-icons
  position absolute
  bottom 0px
  right 0px
  i
    margin-right 10px
    font-size 18px
    cursor pointer
.active-picture-list
  color #26CB51
.methods-button
  width 100px
  height 30px
  line-height 5px
  font-size 13px
  color #888
  border 1px solid #888
  background #000
  &:focus
    background #000
  &:hover
    color #26CB51
    border-color #26CB51
    background #000
</style>
