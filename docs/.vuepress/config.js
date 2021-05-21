module.exports = {
  base: '/online-clip/',
  title: 'Online Clip',
  description: 'A video editor',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  themeConfig: {
    search: false,
    nav: [
      { text: '使用指南', link: '/guide/' },
      { text: '在线体验', link: 'http://172.20.155.102/online-clip-editor' },
      { text: 'GitLab', link: 'http://gitlab.skysri.com/flower/online-clip.git' }
    ],
    sidebar: [
      {
        title: '使用指南',
        path: '/guide/',
      }
    ]
  }
}