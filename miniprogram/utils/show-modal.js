const comfirmOnly = (content) => {
  wx.showModal({
    title: '提示',
    content: content,
    showCancel: false,
    confirmText: '好的',
  })
}

module.exports = {
  comfirmOnly: comfirmOnly
}