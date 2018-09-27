const app = getApp();
const avatar = require("./avatar");

const getUserInfo = (that) => {
  // 获取用户信息
  wx.getSetting({
    success: res => {
      if (res.authSetting['scope.userInfo']) {
        // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
        if (app.globalData.avatarUrl != undefined &&
        app.globalData.userInfo !=undefined) {
          that.setData({
            avatarUrl: app.globalData.avatarUrl,
            userInfo: app.globalData.userInfo
          })
          wx.setStorageSync("userInfo", app.globalData.userInfo)
        } else {
          wx.getUserInfo({
            success: res => {
              let avatarUrl = res.userInfo.avatarUrl;
              app.globalData.avatarUrl = avatarUrl;
              app.globalData.userInfo = res.userInfo;
              avatar.check(that, avatarUrl)
                .then(res => {
                  console.log("用户头像检测: ", res.msg);
                })
              that.setData({
                avatarUrl: avatarUrl,
                userInfo: res.userInfo
              })
              wx.setStorageSync("userInfo", res.userInfo);
            }
          })
        }
      } else {
        wx.navigateTo({
          url: '../login/login',
        })
      }
    }
  })
}

module.exports = {
  getUserInfo: getUserInfo
}