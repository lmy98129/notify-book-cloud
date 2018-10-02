// pages/profile/profile.js
const app = getApp();
const sys = require("../../utils/system");
const login = require("../../utils/login.js");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    specialPhone: '',
    avatarUrl: "/images/user-unlogin.png",
    nickname: "",
    userInfo: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // if (options.isOtherUser) {
      
    // }
    sys.checkPhone(this);

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
    let tmpUserInfo = wx.getStorageSync("userInfo");
    let avatarUrl = tmpUserInfo.avatarUrl;
    let nickname = tmpUserInfo.nickname;
    this.setData({
      avatarUrl: avatarUrl,
      nickname: nickname
    })
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


  editProfile: function() {
    wx.navigateTo({
      url: '../editProfile/editProfile',
    })
  },

})