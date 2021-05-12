const ENV = process.env.NODE_ENV
const PORT = process.env.PORT || '8003'
const HOST = process.env.HOST || '127.0.0.1'
const baseUrl = ENV === 'production' ? '' : `http://${HOST}:${PORT}`
module.exports = {
  publicPath: baseUrl
}
