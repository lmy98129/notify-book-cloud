const avatar = require("./avatar");
const profile = require("./profile");
const bgImg = require("./bg-img");
const auth = require("./auth");
const admin = require("./admin");

const getUserInfo = (that) => {
  // 获取用户信息
  let nickname, avatarUrl, bgImgUrl, tmpUserInfo;
  wx.getSetting({
    success: res => {
      if (res.authSetting['scope.userInfo']) {
        // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
        wx.getUserInfo({
          success: res => {
            nickname = res.userInfo.nickName;
            avatarUrl = res.userInfo.avatarUrl;
            wx.setStorageSync("userInfo", res.userInfo);
            
            // 头像、昵称检测函数
            avatar.check(avatarUrl)
              .then(res => {
                console.log("用户头像检测成功：", res.msg);
                
                // 使用头像检测函数的最终结果，作为头像的最终路径
                let tmpUserInfo = wx.getStorageSync("userInfo");
                avatarUrl = tmpUserInfo.avatarUrl;

                // 对空头像做特殊处理
                if (avatarUrl === undefined || avatarUrl === "") {
                  avatarUrl = "/images/user-unlogin.png";
                  tmpUserInfo.avatarUrl = "/images/user-unlogin.png";
                  wx.setStorageSync("userInfo", tmpUserInfo);
                }

                that.setData({
                  avatarUrl: avatarUrl
                })

                // 开始昵称检测
                return profile.download()
              })
              .then(res => {
                tmpUserInfo = wx.getStorageSync("userInfo");
                if (res.code === 1) {
                  that.setData({
                    nickname: nickname
                  })
                } else if (res.code === 2) {

                  // 更新本地存储的userInfo中的昵称
                  nickname = res.data.nickName;
                  tmpUserInfo.nickName = nickname;
                  wx.setStorageSync("userInfo", tmpUserInfo);
                  that.setData({
                    nickname: nickname
                  })
                }
                console.log("用户昵称检测成功：", res.msg);

                // 开始用户背景图检测
                return bgImg.check()
              })
              .then(res => {

                // 更新本地存储的userInfo中的用户背景图
                bgImgUrl = res.data;
                tmpUserInfo = wx.getStorageSync("userInfo");
                tmpUserInfo.bgImgUrl = bgImgUrl
                wx.setStorageSync("userInfo", tmpUserInfo);
                that.setData({
                  bgImgUrl: bgImgUrl
                })
                console.log("用户背景图检测成功：", res.msg);
                
                // 开始用户权限检测
                return admin.check();
              })
              .then(res => {
                wx.setStorageSync("isAdmin", res.isAdmin);
                console.log("用户权限检测成功：", res.msg);

                if (!res.isAdmin) {
                  // 开始用户审核检测
                  return auth.check()
                } else {
                  wx.setStorageSync("authStatus", "authorized");
                  return Promise.resolve({
                    isAdmin: true
                  });
                }
              })
              .then(res => {
                if (res.isAdmin !== true) {
                  
                  if (res.status === "unauthorized") {
                    that.setData({
                      isRedDot: true
                    });
                  }
                  wx.setStorageSync("authStatus", res.status);
                  console.log("用户审核检测成功：", res.msg);

                }
              })
              .catch(err => {
                console.log("用户信息检测失败： ", err)
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