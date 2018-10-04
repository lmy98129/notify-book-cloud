// pages/auditing-detail/auditing-detail.js
const auditing = require("../../utils/auditing");
const toast = require("../../utils/message").toast;
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let tmpList = wx.getStorageSync("auditingList");
    this.setData({
      content: tmpList[options.index]
    })
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

  previewImg(e) {
    let imgList = this.data.content.authImgUrl;
    let curImg = imgList[e.currentTarget.dataset.index];
    wx.previewImage({
      urls: imgList,
      current: curImg
    });
  },

  allow: async function () {
    let tmpOpenId = this.data.content._openid;
    let tmpArray = [];
    tmpArray.push(tmpOpenId);
    await auditing.allow(tmpArray);
  },

  disallow: async function() {
    let tmpOpenId = this.data.content._openid;
    let tmpArray = [];
    tmpArray.push(tmpOpenId);
    await auditing.disallow(tmpArray);
  }
})