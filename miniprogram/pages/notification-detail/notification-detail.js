// pages/notification-detail/notification-detail.js
const app = getApp();
const toast = require("../../utils/message").toast;
const notify = require("../../utils/notification");
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
    notifyDetail: {},
    mode: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let notifyDetail = wx.getStorageSync(options.mode)[options.index];
    let tmpContent = notifyDetail.content.split("\n");
    let content = "";
    for (let item of tmpContent) {
      content += "&emsp;&emsp;"+item+"\n";
    }
    notifyDetail.content = content;
    this.setData({
      notifyDetail,
      mode: options.mode
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
    let tmpUserInfo = wx.getStorageSync("curUserProfile");
    let bgImgUrl = tmpUserInfo.bgImgUrl,
    nickname = tmpUserInfo.nickName;
    this.setData({
      bgImgUrl,
      nickname
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

  changeStatus: async function() {
    let status, selectedList =[];
    let id = this.data.notifyDetail._id;
    selectedList.push(id);
    switch(this.data.mode) {
      case "unReadArray": status="has-read";
        break;
      case "hasReadArray": status="un-read";
        break;
    }
    let res = await notify.changeStatus(selectedList, status);
  },

  delete: async function() {
    let selectedList =[];
    let id = this.data.notifyDetail._id;
    selectedList.push(id);
    let res = await notify.deleteItems(selectedList);
  }

})