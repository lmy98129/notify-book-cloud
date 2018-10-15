// pages/notification/notification.js
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bgImgUrl: "",
    nickName: "",
    fixTop: false,
    fixVeryTop: false,
    isEmpty: false,
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
  onShow: async function () {
    let tmpUserInfo = wx.getStorageSync("userInfo");
    let bgImgUrl = tmpUserInfo.bgImgUrl,
    nickname = tmpUserInfo.nickName;
    this.setData({
      bgImgUrl,
      nickname
    });
    try {
      let res = await wx.cloud.callFunction({
        name: "notification",
        data: {
          $url: "download"
        }
      });
      switch(res.result.code) {
        case 0:
        case -1:
          this.setData({
            isEmpty: true
          });
          break;
        case 1: 
          this.setData({
            notifiArray: res.result.notification
          })
      }
    } catch (error) {
      console.log(error)
    }
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