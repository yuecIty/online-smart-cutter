<script>
const defaultPicWidth = 100
const defaultPicHeight = 30
const trackScale = 10
let dragTarget = {}
let dragTranslateX = null
let dragWidth = null
let isDropZone = false
let isDragFromTab = false
let pictureList = []
let mouseElement = {}
let picturePosition = {}
let playingPicture = {}
let playingPictureIndex = null
let direction = null
let iconWidth = null
let transitionList = []
export default {
  defaultPicWidth,
  defaultPicHeight,
  trackScale,
  dragTarget,
  dragTranslateX,
  dragWidth,
  isDropZone,
  isDragFromTab,
  pictureList,
  mouseElement,
  picturePosition,
  playingPicture,
  playingPictureIndex,
  direction,
  iconWidth,
  transitionList
}
</script>
