<template>
  <div class="operations-slider">
    <i
      v-if="icon"
      class="el-icon-remove-outline"
      @click="handleMouseDown(0)"
    ></i>
    <el-progress :text-inside="true" :stroke-width="6" :percentage="sliderData"></el-progress>
    <i
      v-if="icon"
      class="el-icon-circle-plus-outline"
      @click="handleMouseDown(1)"
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
      adjustNum: 0
    }
  },
  methods: {
    handleMouseDown (operator) {
      if (operator === 1) {
        this.sliderData += this.step
        if (this.sliderData > 100) {
          this.sliderData = 100
        } else {
          this.$emit('set-time-scale', 'increase', this.sliderData)
        }
      } else {
        this.sliderData -= this.step
        if (this.sliderData < 0) {
          this.sliderData = 0
        } else {
          this.$emit('set-time-scale', 'decrease', this.sliderData)
        }
      }
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
  vertical-align text-top
  width 200px
i
  margin 0px 10px
  vertical-align super
  font-size 20px
  color #ccc
  cursor pointer
>>> .el-progress
  display inline-block
  vertical-align top
  width 60%
  .el-progress-bar__outer
    background-color #c2c2c2
  .el-progress-bar__innerText
    display none
</style>
