//app.js
const DEFAULT_BGIMGURL = "cloud://test-5c133c.7465-test-5c133c/tvs-bg.jpeg";

App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }

    this.globalData = {
      DEFAULT_BGIMGURL,
      DEFAULT_PROFILE: {
        bgImgUrl: `${DEFAULT_BGIMGURL}`,
        authImgUrl: [],
        authRemark: "",
        authStatus: "unauthorized",
        authIsCode: false,
        isAdmin: false,
        isAvatarCustomed: false,
        isNickNameCustomed: false,
        isBgImgCustomed: false
      },
      forcedRefresh: true,
    }
  }
})
