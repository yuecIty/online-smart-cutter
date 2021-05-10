// 时长格式化
export function formatDuration(duration) {
  const hour = Math.floor(duration / 3600)
  const minute = Math.floor(duration % 3600 / 60)
  const second = Math.floor(duration % 60)
  const stringHour = hour < 10 ? '0' + hour : hour
  const stringMinute = minute < 10 ? '0' + minute : minute
  const stringSecond = second < 10 ? '0' + second : second
  return stringHour + ':' + stringMinute + ':' + stringSecond
}
// 颜色值格式转换：RGB -> HEV
export function formatColor(color) {
  var colorArr = color.replace(/(?:\(|\)|rgb|RGB)*/g, '').split(',')
  var strHex = '#'
  var decimal = Number(colorArr[0]) * 65536 + Number(colorArr[1]) * 256 + Number(colorArr[2])
  var hex = decimal.toString(16)
  if (hex.length < 6) {
    hex = '0' + hex
  }
  strHex += hex
  // 处理#000000显示成#00的情况
  if (strHex.length < 6) {
    strHex = '#000000'
  }
  return strHex.toUpperCase()
}
