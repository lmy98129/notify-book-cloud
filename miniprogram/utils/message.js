const confirmOnly = (content) => {
  wx.showModal({
    title: '提示',
    content: content,
    showCancel: false,
    confirmText: '好的',
  })
}

const toast = (title, icon, duration) => {
  let obj = {
    title: title
  };
  if (icon != undefined) {
    obj.icon = icon;
  }
  if (duration != undefined) {
    obj.duration = duration;
  }
  wx.showToast(obj);
}

module.exports = {
  confirmOnly: confirmOnly,
  toast: toast
}