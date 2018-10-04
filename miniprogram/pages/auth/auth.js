// pages/auth/auth.js
const auth = require("../../utils/auth");
const toast = require("../../utils/message").toast;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    authImgArray: [],
    remark: "",
    authStatus: "",
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
    this.setData({
      authStatus: wx.getStorageSync("authStatus")
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

  inputRemark(e) {
    let value = e.detail.value;
    this.setData({
      remark: value
    })
  },

  addBtn() {
    let that = this, tmpArray = this.data.authImgArray;
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        tmpArray = tmpArray.concat(res.tempFilePaths);
        that.setData({
          authImgArray: tmpArray
        })
      }
    })
  },

  delBtn(e) {
    let index = e.target.dataset.index;
    let tmpAuthImgArray = this.data.authImgArray;
    tmpAuthImgArray.splice(index, 1);
    this.setData({
      authImgArray: tmpAuthImgArray
    })
  },

  submit() {
      auth.upload(this.data.authImgArray, this.data.remark, this);
  }
})