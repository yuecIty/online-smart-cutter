<template>
  <div>
      <div class="video-controls">
        <div class="controls-icons">
          <el-image
            v-if="!videoPlay"
            class="controls-play"
            :src="controlsIcons.play"
            @click="handleVideoPlay"
          ></el-image>
          <el-image
            v-if="videoPlay"
            class="controls-pause"
            :src="controlsIcons.pause"
            @click="handleVideoPause"
          ></el-image>
        </div>
        <el-slider
          v-model="sliderData"
          class="video-slider"
          :min="0"
          :max="trackDuration"
          :step="0.1"
          :format-tooltip="formatTooltip"
          @mousedown.native="handleVideoPause"
          @change="handleSliderChange"
        ></el-slider>
        <div class="controls-duration">
          {{ trackCurrentTimeString }} / {{ trackDurationString }}
        </div>
      </div>
  </div>
</template>
<script>
import { formatDuration } from '@/components/onlineClip/global/functions'
export default {
  props: {
    videoPlay: {
      type: Boolean,
      default: false
    },
    trackDuration: {
      type: Number,
      default: 0
    },
    trackCurrentTime: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      controlsIcons: {
        play: require('../../assets/play.png'),
        pause: require('../../assets/pause.png')
      },
      sliderData: 0,
      trackCurrentTimeString: '00:00:00',
      trackDurationString: '00:00:00'
    }
  },
  watch: {
    trackDuration: function (time) {
      this.trackDurationString = formatDuration(this.trackDuration)
      return time
    },
    trackCurrentTime: function (time) {
      this.sliderData = time
      this.trackCurrentTimeString = formatDuration(this.sliderData)
    }
  },
  methods: {
    handleVideoPlay () {
      this.$emit('video-play')
    },
    handleVideoPause () {
      this.$emit('video-pause')
    },
    handleSliderChange () {
      this.trackCurrentTimeString = formatDuration(this.sliderData)
      this.$emit('slider-change', this.sliderData)
    },
    formatTooltip (time) {
      return formatDuration(time)
    }
  },
  created () {
    this.trackDurationString = formatDuration(this.trackDuration)
    this.sliderData = this.trackCurrentTime
  }
}
</script>
<style lang="stylus" scoped>
.video-controls
  position relative
  margin-top 10px
  padding 0px 10px
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
</style>
