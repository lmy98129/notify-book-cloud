// pages/search/search.js
const toast = require("../../utils/message").toast;
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputVal: "",
    titleVal: "&nbsp;",
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

  showInput: function () {
    this.setData({
        inputShowed: true
    });
  },
  hideInput: function () {
      this.setData({
          inputVal: "",
          inputShowed: false,
          titleVal: "&nbsp;"
      });
  },
  clearInput: function () {
      this.setData({
          inputVal: "",
          titleVal: "&nbsp;"
      });
  },
  inputTyping: function (e) {
    let value = e.detail.value;
    if (value === "") {
      this.setData({
        inputVal: value,
        titleVal: "&nbsp;"
      })
    } else {
      this.setData({
        inputVal: value,
        titleVal: value
      })
    }
  },
  search: async function() {
    let value = this.data.inputVal;
    if (value === "" || value === undefined) {
      toast("搜索关键字不能为空", "none");
      return;
    }
    wx.showLoading({
      title: "搜索中"
    })
    let res = await wx.cloud.callFunction({
      name: "search",
      data: {
        text: value
      }
    });
    wx.hideLoading();
    if (res.result.code === 1) {
      console.log("搜索成功", res.result.searchRes);
    } else {
      toast("搜索请求失败", "none");
      console.log("搜索失败", res.result.error);
    }
  }
})