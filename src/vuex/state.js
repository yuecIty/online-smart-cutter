const state = {
  // onlineClip外数据
  lastestDownloadList: [],
  // 常量
  trackScale: 10,
  defaultMaterialHeight: 55,
  defaultPicWidth: 100,
  defaultPicHeight: 30,
  defaultTextHeight: 28,
  defaultDrrHeight: 70,
  // 当前操作数据
  list: null, // 当前操作的数组名
  vm: null, // 当前操作的this
  trackId: null, // 当前操作对应的轨道id
  trackIndex: null, // 当前操作的轨道块所属轨道index
  targetTrackIndex: null, // 当前操作对应的轨道index
  playingName: null, // 当前操作对应的playing-
  // 重要公用数据
  tracksTime: { // 各轨道时长
    material: 0,
    picture: 0,
    text: 0
  },
  timeAxisDuration: 0, // 当前最长的轨道时长
  trackDuration: 0, // 当前视频轨道时长
  selected: { // 当前选择块的基本信息及对应元素
    index: null,
    trackIndex: null,
    type: null,
    target: null,
    width: null,
    dataURL: null,
    duration: null
  },
  selectedTarget: {}, // 当前选择块对应数据
  // 当前播放区域显示的数据
  playingMaterial: {},
  playingPicture: [],
  playingPictureIndex: [],
  playingText: [],
  playingTextIndex: [],
  playingTransition: {},
  // 指针数据
  pointerLeft: 0,
  pointerDuration: 0,
  // 标签页数据
  materialTabList: [],
  materialTabNewList: [], // 暂时的已选素材列表(用于onlineClip以外区域进行素材添加)
  materialFileList: [],
  materialFileLastLength: 0,
  isCloseClip: false,
  isMaterialUploading: false,
  isEditMaterialUploading: false,
  isPictureUploading: false,
  // 轨道数据
  materialTrackList: [],
  materialTrackWidth: 500,
  pictureTrackList: [[]],
  textTrackList: [[]],
  transitionTrackList: [],
  operatingTransition: {},
  tracks: [
    {
      list: 'pictureTrackList',
      playing: 'playingPicture',
      drr: 'pictureDrr'
    },
    {
      list: 'textTrackList',
      playing: 'playingText',
      drr: 'textDrr'
    }
  ],
  // 视频轨道操作动作数据
  operationName: null,
  operationIndex: null,
  operationNewIndex: null,
  // 拖拽数据
  dragTranslateX: 0,
  dragWidth: 0,
  dragIndex: null,
  direction: null,
  dragImage: new Image(),
  isDropZone: false,
  isDragFromTab: false,
  isDragging: false,
  isDragDrop: false,
  isConflic: false,
  isTrackDrag: false,
  dragPlayingName: null,
  picturePosition: {
    x: 0,
    y: 0
  },
  dragTarget: {},
  mouseElement: null,
  originalElement: null,
  // drr数据
  textEditIndex: null,
  originalWidth: null,
  proportion: 1,
  activeName: null,
  isPictureActive: false,
  isTextActive: false,
  tabResizedTarget: {
    width: 0,
    height: 0
  },
  // 其他操作数据
  isTrackResize: false,
  needPointerJudge: {
    isNeed: false,
    target: null
  }
}

export default state