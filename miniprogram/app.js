//app.js
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
      DEFAULT_BGIMGURL: "cloud://test-5c133c.7465-test-5c133c/tvs-bg.jpeg",
      forcedRefresh: true,
    }
  }
})
