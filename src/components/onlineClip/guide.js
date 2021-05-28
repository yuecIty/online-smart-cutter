const steps =  [
  {
    element: '#materialArea',
    popover: {
      title: '标签页区域',
      description: '用于展示所有可添加到轨道的各类素材。',
      position: 'right'
    }
  },
  {
    element: '#materialItem',
    popover: {
      title: '添加到轨道方式',
      description: '鼠标选择并拖拽到对应轨道位置添加 或 点击各素材右上角图标自动添加。',
      position: 'right'
    }
  },
  {
    element: '#videoArea',
    popover: {
      title: '视频播放区域',
      description: '用于 显示指针所在帧画面 及 操作DRR。',
      position: 'left'
    }
  },
  {
    element: '#buttonArea',
    popover: {
      title: '操作按钮区域',
      description: '用于展示功能性操作按钮。',
      position: 'top-center'
    }
  },
  {
    element: '#deleteIcon',
    popover: {
      title: '删除按钮',
      description: '点击可对选中的 轨道块 进行删除操作。',
      position: 'bottom'
    }
  },
  {
    element: '#clipIcon',
    popover: {
      title: '裁剪按钮',
      description: '点击可对选中的 视频轨道块 进行裁剪操作。',
      position: 'bottom'
    }
  },
  {
    element: '#submitButton',
    popover: {
      title: '提交按钮',
      description: '点击可打开提交弹窗，弹窗内提供视频的最终效果预览 及 视频相关信息填写。'
    }
  },
  {
    element: '#tracksArea',
    popover: {
      title: '轨道区域',
      description: '展示所有可操作的轨道块。',
      position: 'top-center'
    }
  },
  {
    element: '#multiTracksItem',
    popover: {
      title: '多轨道支持',
      description: '该类型轨道支持多轨道化，鼠标悬停即可显示对应操作区域。',
      position: 'right'
    }
  },
]

export default steps