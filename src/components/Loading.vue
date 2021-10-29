<template>
  <div
    class="loading-container"
    :style="{
      color: color,
      'padding-left': '15px'
    }"
  >
    <div v-if="type === 1" class="type-one"></div>
    <div v-if="type === 2" class="type-four">
      <div class="type-four-one"></div>
      <div class="type-four-two"></div>
      <div class="type-four-three"></div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    color: {
      type: String,
      default: '#ef6139'
    },
    type: {
      type: Number,
      default: 1
    }
  }
}
</script>
<style lang="stylus" scoped>
border-one = .4vw
width-three = 10px

.loading-container
  div
    width 15px
    height 15px
    transition all .5s
@keyframes loader-one
  0%
    transform rotate(0deg)
  100%
    transform rotate(360deg)
.type-one
  position relative
  width 15px
  height 15px
  border border-one solid transparent
  border-top-color currentColor
  border-radius 50%
  animation 1s loader-one linear infinite
.type-one:before
  content ''
  display block
  position absolute
  top -(border-one)
  left -(border-one)
  width 15px
  height 15px
  border border-one solid currentColor
  border-radius 50%
  opacity .5

@keyframes loader-four
  0%, 100%
    transform scale(.9)
  50%
    transform scale(0)
.type-four
  position relative
  width fit-content !important
.type-four-one,
.type-four-two,
.type-four-three
  display inline-block
  width width-three !important
  height width-three !important
  border-radius 50%
  background currentcolor
  animation 1.2s loader-four ease-in-out infinite
.type-four-two
  position absolute
  left width-three * 1.3
  animation-delay .2s
.type-four-three
  position absolute
  left width-three * 2.6
  animation-delay .4s
</style>
