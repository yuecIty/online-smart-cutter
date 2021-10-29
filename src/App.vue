<template>
  <div id="app">
    <OnlineClip></OnlineClip>
  </div>
</template>

<script>
import OnlineClip from '@/components/OnlineClip.vue'

export default {
  name: 'App',
  components: {
    OnlineClip
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}
</style>
