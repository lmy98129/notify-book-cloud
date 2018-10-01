const app = getApp();
const avatar = require("./avatar");

const getUserInfo = (that) => {
  // 获取用户信息
  wx.getSetting({
    success: res => {
      if (res.authSetting['scope.userInfo']) {
        // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
        wx.getUserInfo({
          success: res => {
            let avatarUrl = res.userInfo.avatarUrl;
            wx.setStorageSync("userInfo", res.userInfo);
            
            // 头像检测函数
            avatar.check(avatarUrl)
              .then(res => {
                console.log("用户头像检测成功：", res.msg);
                
                // 使用头像检测函数的最终结果，作为头像的最终路径
                let tmpUserInfo = wx.getStorageSync("userInfo");
                avatarUrl = tmpUserInfo.avatarUrl;
                that.setData({
                  avatarUrl: avatarUrl
                })
              })
              .catch(err => {
                console.log("用户头像检测失败： ", err.msg)
              })
          }
        })
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