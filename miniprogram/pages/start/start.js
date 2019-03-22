// miniprogram/pages/start/start.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    animation: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    let animation= wx.createAnimation({}) //创建一个动画实例

    animation.opacity(1).step({
      duration: 1000
    });
    this.setData({
      animation: animation.export()
    })
    setTimeout(() => {
      animation.opacity(0).step({
        duration: 1000
      });
      this.setData({
        animation: animation.export()
      })
      setTimeout(() => {
        if (getCurrentPages().length === 1) {
          wx.switchTab({
            url: "/pages/profile/profile"
          })
        } else {
          wx.navigateBack({
            delta: 1
          })
        }
      }, 1500)
    }, 4000);
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

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})