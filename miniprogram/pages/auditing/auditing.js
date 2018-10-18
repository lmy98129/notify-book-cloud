// pages/auditing/auditing.js
const auditing = require("../../utils/auditing");
const toast = require("../../utils/message").toast;
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    auditingList: [],
    tabIndex: 0,
    selectedList: []
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
    let res = await auditing.download(this); 
    wx.setStorageSync("auditingList", res); 
    this.setData({
      auditingList: res
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

  tabHandler(e) {
    let index = parseInt(e.target.dataset.index);
    this.setData({
      tabIndex: index
    })
  },

  bindChecked(e) {
    this.setData({
      selectedList: e.detail.value
    })
  },

  goDetail(e) {
    wx.navigateTo({
      url: "../auditing-detail/auditing-detail?index=" + e.target.dataset.index
    })
  },

  allow: async function () {
    let length = this.data.selectedList.length
    if (length === 0) {
      return;
    } else if (length > 20) {
      toast("暂不支持同时更改20条以上数据", "none");
      return;
    }
    let res = await auditing.allow(this.data.selectedList);
    if (res.code === 0) {
      res = await auditing.download(this); 
      wx.setStorageSync("auditingList", res); 
      this.setData({
        auditingList: res
      })
    }
  },

  disallow: async function() {
    let length = this.data.selectedList.length
    if (length === 0) {
      return;
    } else if (length > 20) {
      toast("暂不支持同时更改20条以上数据", "none");
      return;
    }
    let res = await auditing.disallow(this.data.selectedList);
    if (res.code === 0) {
      res = await auditing.download(this); 
      wx.setStorageSync("auditingList", res); 
      this.setData({
        auditingList: res
      })
    }
  }
})