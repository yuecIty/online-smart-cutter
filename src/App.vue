<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <OnlineClip></OnlineClip>
  </div>
</template>

<script>
import OnlineClip from './components/onlineClip/OnlineClip.vue'

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
  color: #2c3e50;
  margin-top: 60px;
}
</style>
