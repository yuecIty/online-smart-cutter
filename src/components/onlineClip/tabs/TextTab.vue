<template>
  <div v-loading="isTextLoading">
    <!-- 字幕列表页 -->
    <div v-show="activeName !== 'text'" class="picture-container">
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
      <!-- 字幕列表 -->
      <div
        v-if="!isEmpty"
        v-infinite-scroll="handlePictureMore"
        :infinite-scroll-delay="300"
        :infinite-scroll-distance="10"
        style="overflow-y: scroll"
        class="picture-list"
      >
        <div
          v-for="(item, index) in textList.slice(0, picShowAmount)"
          :key="item.picId"
          class="picture-style"
          @mouseenter="mouseTarget = index"
          @mouseleave="mouseTarget = null"
          @mousedown="judgePictureDraggable()"
        >
          <i
            v-show="mouseTarget === index"
            class="el-icon-circle-plus-outline picture-plus-icon"
            title="添加"
            @click="handleTextIconAdd(item)"
          ></i>
          <!-- 列表内样式应根据设置样式显示 -->
          <div
            class="text-list"
            :draggable="materialTrackList.length !== 0"
            :style="{
              fontFamily: item.fontFile,
              fontSize: item.fontSize / 4 < 14 ? '14px' : item.fontSize / 4 + 'px',
              fontWeight: item.bold ? 600 : 400,
              fontStyle: item.italic ? 'italic' : 'normal',
              color: item.fontColor,
              textAlign: item.alignment,
              letterSpacing: item.wordSpacing,
              opacity: item.transparency,
              border: item.frame ? 'solid 1px #FFFFFF' : 'none',
              textShadow: item.shadowY ? '0px 1.5px #000000' : 'none',
              textDecoration: item.underLine ? 'underline' : 'none',
              transform: 'rotate(' + item.fontWhirl + ')'
            }"
            @dragstart="handleTextDragStart({
              e: $event,
              item: item,
              index: index,
              list: 'textTrackList',
              prefix: 'text',
              trackId: 'textTrack',
              isTrackDrag: false
            })"
            @drag="handleTextDragging"
            @dragend="handleTextDragEnd"
          >
            <span>{{ item.text }}</span>
          </div>
        </div>
      </div>
      <div v-else class="picture-empty">
        <span>暂无</span>
      </div>
    </div>
    <!-- 字幕操作页 -->
    <div v-show="activeName === 'text'" class="text-operation">
      <!-- 字幕操作类型按钮: 文字 / 动画 -->
      <div
        v-for="type in typeList"
        :key="type.id"
        :class="{
          'category-style': true,
          'category-active': typeIndex === type.id
        }"
        @click="typeIndex = type.id"
      > {{ type.name }}</div>
      <!-- 文字 -->
      <div v-if="typeIndex === 0" class="operation-container">
        <div class="first-row-container">
          <div class="first-row">
            <span>字体</span>
            <el-select v-model="fontFile" class="long-select" filterable default-first-option @change="handleFontFamilyChange">
              <el-option
                v-for="font in fontFileList"
                :key="font.value"
                :label="font.name"
                :value="font.value"
              ></el-option>
            </el-select>
          </div>
          <div class="first-row">
            <span>字号</span>
            <el-select v-model="fontSize" class="select-style" default-first-option @change="handleFontSizeChange">
              <!-- 12至200 -->
              <el-option
                v-for="size in 95"
                :key="size"
                :label="size * 2 + 10"
                :value="size * 2 + 10"
              ></el-option>
            </el-select>
          </div>
          <div class="first-row">
            <span>字体颜色</span>
            <el-input v-model="fontColor" class="color-input">
              <el-color-picker
                slot="append"
                v-model="fontColor"
                class="color-picker"
                size="mini"
                color-format="hex"
                @change="handleFontColorClear"
                @active-change="handleFontColorChange"
              ></el-color-picker>
            </el-input>
          </div>
        </div>
        <div class="font-style-container">
          <span>文本样式</span>
          <i
            v-for="(item, index) in fontStyleList"
            :key="item.name"
            class="font-style-style"
            :class="item.className"
            :style="{
              color: getIsActive(item) || overIndex === index ? '#26CB51' : '#707070'
            }"
            @mouseover="overIndex = index"
            @mouseout="overIndex = null"
            @click="handleFontStyleChange(item)"
          ></i>
        </div>
        <div>
          <span>字间距</span>
          <el-slider
            v-model="letterSpacing"
            class="operation-area"
            :show-input="true"
            :show-tooltip="false"
            :min="0"
            :max="300"
            :step="1"
          ></el-slider>
        </div>
        <div>
          <span>行间距</span>
          <el-slider
            v-model="lineHeight"
            class="operation-area"
            :show-input="true"
            :show-tooltip="false"
            :min="0"
            :max="300"
            :step="100"
          ></el-slider>
        </div>
        <div>
          <span>透明度</span>
          <el-slider
            v-model="opacity"
            class="operation-area"
            :show-input="true"
            :show-tooltip="false"
            :min="0"
            :max="1"
            :step="0.1"
          ></el-slider>
        </div>
      </div>
      <!-- 动画 -->
      <!-- <div v-if="typeIndex === 1" class="operation-container">
        <el-button size="mini" type="primary">+ 新增动画</el-button>
      </div> -->
    </div>
  </div>
</template>
<script>
import { formatColor } from '@/components/onlineClip/global/functions'
import { mapState, mapMutations } from 'vuex'
export default {
  props: {
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      mouseTarget: {},
      firstCategoryList: [],
      secondCategoryList: [],
      typeList: [
        {
          name: '文字',
          id: 0
        }
        // {
        //   name: '动画',
        //   id: 1
        // }
      ],
      textList: [
        { wordSpacing: 0, borderW: false, bold: true, rows: 10, italic: false, lineSpacing: 1, fontFile: 'sans-serif', whirl: 0, shadowY: false, transparency: '1', underLine: false, fontSize: 64, page: 1, text: '标题', alignment: 'center', fontColor: '#ffffff', frame: false },
        { wordSpacing: 0, borderW: false, bold: false, rows: 10, italic: false, lineSpacing: 1, fontFile: 'sans-serif', whirl: 0, shadowY: false, transparency: '1', underLine: false, fontSize: 50, page: 1, text: '副标题', alignment: 'center', fontColor: '#ffffff', frame: false },
        { wordSpacing: 0, borderW: false, bold: false, rows: 10, italic: false, lineSpacing: 1, fontFile: 'cursive', whirl: 0, shadowY: false, transparency: '1', underLine: false, fontSize: 24, page: 1, text: '字幕', alignment: 'center', fontColor: '#ffffff', frame: false }
      ],
      fontStyleList: [ // 字体样式所需的对应操作数据
        {
          name: 'bold',
          styleName: 'fontWeight',
          value: 600,
          originValue: 400,
          className: 'iconfont icon-jiacu'
        },
        {
          name: 'underLine',
          styleName: 'textDecoration',
          value: 'underline',
          originValue: 'none',
          className: 'iconfont icon-xiahuaxian'
        },
        {
          name: 'italic',
          styleName: 'fontStyle',
          value: 'italic',
          originValue: 'normal',
          className: 'iconfont icon-xieti'
        },
        {
          name: 'left',
          styleName: 'textAlign',
          className: 'iconfont icon-juzuoduiqi'
        },
        {
          name: 'center',
          styleName: 'textAlign',
          className: 'iconfont icon-juzhongduiqi'
        },
        {
          name: 'right',
          styleName: 'textAlign',
          className: 'iconfont icon-juyouduiqi'
        },
        {
          name: 'borderW',
          styleName: 'webkitTextStroke',
          value: '1px #000000',
          originValue: '0px',
          className: 'iconfont icon-miaobian enlarge-icon'
        },
        {
          name: 'shadowY',
          styleName: 'textShadow',
          value: '0px 1.5px #000000',
          originValue: 'none',
          className: 'iconfont icon-yinying enlarge-icon'
        }
        // {
        //   name: 'frame',
        //   styleName: 'border',
        //   value: 'solid 1px #FFFFFF',
        //   originValue: 'none',
        //   className: 'iconfont icon-wenzibiankuang enlarge-icon'
        // }
      ],
      overIndex: null,
      isEmpty: false,
      isTextLoading: false,
      picShowAmount: 20,
      typeIndex: 0,
      loadingImage: require('@/assets/material1004.png'),
      fontFileList: [],
      fontFile: null,
      fontSize: null,
      fontColor: '#FFFFFF',
      letterSpacing: 0,
      lineHeight: 100,
      opacity: 1
    }
  },
  computed: {
    ...mapState({
      activeName: state => state.activeName,
      selected: state => state.selected,
      selectedTarget: state => state.selectedTarget,
      materialTrackList: state => state.materialTrackList,
      textTrackList: state => state.textTrackList
    })
  },
  watch: {
    selectedTarget: function (val) {
      if (this.activeName !== 'text') {
        return true
      }
      // 若当前选择块为字幕类型 则操作标签页需根据当前值显示数据
      this.initTab(val)
    },
    letterSpacing: function (val) {
      if (this.isEdit) {
        // 若当前有处于编辑状态的drr 需退出
        this.$emit('stop-edit', this.selected.trackIndex)
      }
      this.letterSpacing = val.toFixed(0) * 1
      this.$store.commit('drrTabFontStyle', { styleName: 'letterSpacing', styleValue: this.letterSpacing, name: 'wordSpacing', value: val, isOnly: true })
    },
    lineHeight: function (val) {
      if (this.isEdit) {
        // 若当前有处于编辑状态的drr 需退出
        this.$emit('stop-edit', this.selected.trackIndex)
      }
      const tempNumber = (val / 100).toFixed(0) * 1
      this.lineHeight = tempNumber * 100
      this.$store.commit('drrTabFontStyle', { styleName: 'lineHeight', styleValue: this.lineHeight / 100, name: 'lineSpacing', value: val / 100, isOnly: true })
    },
    opacity: function (val) {
      if (this.isEdit) {
        // 若当前有处于编辑状态的drr 需退出
        this.$emit('stop-edit', this.selected.trackIndex)
      }
      this.$store.commit('drrTabFontStyle', { styleName: 'opacity', styleValue: val, name: 'transparency', value: val, isOnly: true })
    }
  },
  methods: {
    ...mapMutations({
      handleTextDragStart: 'dragStart',
      handleTextDragging: 'tabDragging',
      handleTextDragEnd: 'tabDragEnd'
    }),
    handleSecondCategorySearch () {},
    handlePictureSearch () {},
    handlePictureMore () {},
    judgePictureDraggable () {
      // 判断当前字幕是否可以拖拽添加
      if (this.materialTrackList.length === 0) {
        this.$message({
          type: 'warning',
          message: '视频轨道为空，请添加视频素材后再试'
        })
        return false
      }
      return true
    },
    handleTextIconAdd (text) {
      // 添加字幕方式 - 点击列表图标
      if (this.materialTrackList.length === 0) {
        return false
      }
      this.$emit('icon-add', 'text', text)
    },
    handleFontFamilyChange (font) {
      if (this.isEdit) {
        this.$emit('stop-edit', this.selected.trackIndex)
      }
      this.$store.commit('drrTabFontStyle', { styleName: 'fontFamily', styleValue: font, name: 'fontFile', value: font, isOnly: true })
    },
    handleFontSizeChange (size) {
      if (this.isEdit) {
        this.$emit('stop-edit', this.selected.trackIndex)
      }
      this.$store.commit('drrTabFontOperation', { styleName: 'fontSize', styleValue: size, isNeedPx: true })
    },
    handleFontColorClear (color) {
      // color-picker选择清空时 设置默认的颜色值#FFFFFF
      if (color === null) {
        this.handleFontColorChange('rgb(255, 255, 255)')
      }
    },
    handleFontColorChange (color) {
      // color-picker选择的颜色值发生改变时 各项数据同步
      if (this.isEdit) {
        this.$emit('stop-edit', this.selected.trackIndex)
      }
      this.fontColor = formatColor(color)
      this.$store.commit('drrTabFontStyle', { styleName: 'color', styleValue: this.fontColor, name: 'fontColor', value: this.fontColor, isOnly: true })
    },
    handleFontStyleChange (target) {
      // 字体样式分类处理
      switch (target.styleName) {
        case 'textAlign':
          this.handleTextAlign(target)
          break
        default:
          this.handleBooleanStyle(target)
      }
    },
    handleTextAlign (target) {
      const isAcitve = this.selectedTarget['alignment'] === target.name
      // 字体样式 - 文本对齐方式 默认居左
      const styleValue = isAcitve ? 'left' : target.name
      this.$store.commit('drrTabFontStyle', { styleName: target.styleName, styleValue: styleValue, name: 'alignment', value: styleValue })
    },
    handleBooleanStyle (target) {
      const isAcitve = this.selectedTarget[target.name]
      const styleValue = isAcitve ? target.originValue : target.value
      this.$store.commit('drrTabFontStyle', { styleName: target.styleName, styleValue: styleValue, name: target.name, value: !isAcitve })
    },
    getIsActive (target) {
      // 判断是否采用某字体样式 需要改变对应的图标颜色
      if (target.styleName === 'textAlign') {
        return this.selectedTarget['alignment'] === target.name
      }
      return this.selectedTarget[target.name]
    },
    initTab (val) {
      // 操作标签页需根据当前对象更新数据
      this.fontFile = val.fontFile
      this.fontSize = val.fontSize
      this.fontColor = val.fontColor || '#000000'
      this.letterSpacing = val.wordSpacing
      this.lineHeight = val.lineSpacing * 100
      this.opacity = val.transparency || 1
    }
  },
  created () {
    // 关闭接口
    // this.isTextLoading = true
    // 获取字幕列表
    // this.$service.getTextList().then(data => {
    //   this.textList = data.data
    //   this.isTextLoading = false
    // })
    // // 获取字体列表
    // this.$service.getFontFileList().then(data => {
    //   this.fontFileList = data.data
    // })
    this.$nextTick(() => {
      if (this.activeName === 'text') {
        // 若当前激活drr为字幕 则需对应显示操作标签页及对应数据
        this.initTab(this.selectedTarget)
      }
    })
  }
}
</script>
<style lang="stylus" scoped>
.picture-container
  position relative
  height 100%
  overflow hidden
.picture-list
  user-select none // 禁止选中 避免在不允许拖拽的情况下 使用浏览器默认选中行为后再进行拖拽
.picture-style
  display inline-block
  position relative
  margin 5px
  width 88px
  height 50px
  vertical-align top
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
.picture-plus-icon
  position absolute
  top 1px
  right 1px
  font-size 15px
  font-weight 600
  cursor pointer
  z-index 2
.text-list
  width 100%
  height 50px
  line-height 50px
.category-style
  display inline-block
  margin 3px
  padding 0px 10px
  max-width 80px
  height 25px
  line-height 25px
  text-align center
  font-size 12px
  color #999
  border 1px solid #888
  border-radius 5px
  cursor pointer
  transition all .3s
  &:hover
    border 1px solid #26CB51
    color #26CB51
.category-active
  border 1px solid #26CB51
  color #26CB51
.text-operation
  span
    display inline-block
    width 10%
    text-align left
    vertical-align super
.operation-container
  padding 30px 10px 0
.first-row
  display inline-block
  margin 0 40px 20px 0
  span
    display inline
    padding-right 20px
.select-style
  width 100px
.long-select
  width 200px
.color-input
  width 130px
  >>>.el-input-group__append
    padding 0px
    vertical-align bottom
.color-picker
  >>>.el-color-picker__trigger
    padding 0px
    width 31px
    height 27px
    vertical-align middle
    border none
.font-style-container
  height 40px
.font-style-style
  display inline-block
  margin 0px 10px
  &:hover
    color #26CB51
    cursor pointer
.enlarge-icon
  font-size 18px
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
</style>
