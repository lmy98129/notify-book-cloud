const confirmOnly = (content) => {
  wx.showModal({
    title: '提示',
    content,
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
  } else {
    obj.icon = "none";
  }
  if (duration != undefined) {
    obj.duration = duration;
  }
  wx.showToast(obj);
}

const modal = (content) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: '提示',
      content,
      success(res) {
        resolve(res);
      }
    })
  })
}

module.exports = {
  confirmOnly,
  toast,
  modal
}