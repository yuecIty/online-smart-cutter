<template>
  <div class="operations-slider">
    <i
      v-if="icon"
      class="el-icon-remove-outline"
      @click="sliderData -= step"
      @mousedown="handleMouseDown(0)"
      @mouseup="handelMouseUp"
    ></i>
    <el-slider
      v-model="sliderData"
      class="material-slider"
      :min="min"
      :max="max"
      :step="step"
      :style="{
        width: width + 'px'
      }"
    ></el-slider>
    <i
      v-if="icon"
      class="el-icon-circle-plus-outline"
      @click="sliderData += step"
      @mousedown="handleMouseDown(1)"
      @mouseup="handelMouseUp"
    ></i>
  </div>
</template>
<script>
export default {
  props: {
    icon: {
      type: Boolean,
      default: false
    },
    data: {
      type: Number,
      default: 0
    },
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    },
    width: {
      type: Number,
      default: 100
    },
    step: {
      type: Number,
      default: 1
    }
  },
  data () {
    return {
      sliderData: 0,
      timer: 0,
      isMax: true
    }
  },
  methods: {
    handleMouseDown (operator) {
      this.timer = setInterval(() => {
        if (operator) {
          this.sliderData++
          this.isMax = true
        } else {
          this.sliderData--
          this.isMax = false
        }
      }, 100)
    },
    handelMouseUp () {
      clearInterval(this.timer)
      if (this.min < this.sliderData && this.sliderData < this.max) this.$emit('set-time-scale', this.isMax)
    }
  },
  created () {
    this.sliderData = this.data
  }
}
</script>
<style lang="stylus" scoped>
.operations-slider,
.material-slider
  display inline-block
  vertical-align text-bottom
i
  margin 0px 10px
  vertical-align super
  font-size 20px
  color #ccc
  cursor pointer
  &:hover,
  &:focus
    color #409eff
>>>.el-slider__bar
  height 4px
>>>.el-slider__button-wrapper
  top -16px
>>>.el-slider__button
  width 10px
  height 10px
>>>.el-slider__runway
  height 4px
  margin 14px 0
</style>
