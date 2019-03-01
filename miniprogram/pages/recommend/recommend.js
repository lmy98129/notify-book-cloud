Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    recList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let { mode } = options;
    let title;
    if (mode !== undefined && mode !== "") {
      this.setData({ mode })
      switch(mode) {
        case "sameYearRecList":
          title = "同届校友";
          break;
        case "sameMajorRecList":
          title = "同系同学";
          break;
      }
      this.setData({ title });
    } else {
      wx.switchTab({
        url: "../index/index"
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let { mode } = this.data;
    let tmpUserInfo = wx.getStorageSync("curUserProfile");
    let bgImgUrl = tmpUserInfo.bgImgUrl,
    nickname = tmpUserInfo.nickName;
    let recList = wx.getStorageSync(mode);
    this.setData({
      bgImgUrl,
      nickname,
      recList,
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  onPageScroll: function(e) {
    if (e.scrollTop > 0) {
      this.setData({
        fixVeryTop: true
      })
    } 
    if (e.scrollTop > 80) {
      this.setData({
        fixTop: true
      })
    } else {
      this.setData({
        fixTop: false,
        fixVeryTop: false
      })
    }
  },

})