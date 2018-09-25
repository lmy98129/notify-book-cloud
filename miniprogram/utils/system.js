const checkPhone = (that) => {
  // 获取系统信息
  let sysInfo = wx.getSystemInfoSync();
  switch (sysInfo.model) {
    case "iPhone 5":
    case "iPhone 4":
    case "iPhone 5s":
    case "iPhone se":
      that.setData({
        specialPhone: "ip5"
      });
      break;
    case "iPhone 6":
    case "iPhone 6s":
    case "iPhone 7":
    case "iPhone 8":
      that.setData({
        specialPhone: "ip6"
      });
      break;
    case "iPhone 6 Plus":
    case "iPhone 6s Plus":
    case "iPhone 7 Plus":
    case "iPhone 8 Plus":
      that.setData({
        specialPhone: "ip6p"
      });
      break;
    case "iPhone X":
    case "iPhone Xs":
    case "iPhone Xs Max":
    case "iPhone Xr":
      that.setData({
        specialPhone: "ipx"
      });
      break;
    default:
      break;
  }
}

module.exports = {
  checkPhone: checkPhone
}