// pages/contact/contact.js
const contact = require("../../utils/contact");
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bgImgUrl: "",
    fixTop: false,
    fixVeryTop: false,
    testArray: [],
    nickname: "",
    contactArray: []
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
    wx.showLoading({
      title: "加载中"
    });
    let res = await contact.download();
    wx.hideLoading();
    if (res.data != undefined) {
      console.log("通讯录下载成功：", res.msg);
      this.setData({
        contactArray: res.data.friendList
      })
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

  goSearch() {
    if (wx.getStorageSync("authStatus") !== "authorized") {
      wx.navigateTo({
        url: "../auth/auth"
      })
    } else {
      wx.navigateTo({
        url: "../search/search"
      })
    }
  }
})