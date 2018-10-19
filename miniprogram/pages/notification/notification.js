// pages/notification/notification.js
const app = getApp();
const toast = require("../../utils/message").toast;
const getFormid = require("../../utils/formid").getFormid;
const notify = require("../../utils/notification");
const formid = require("../../utils/formid");
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
    tabIndex: 0,
    hasReadArray: [],
    unReadArray: [],
    isEdit: false,
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
    formid.upload();
    await notify.download(this);
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
    let index = parseInt(e.target.dataset.index), that = this;
    this.setData({
      tabIndex: index
    })
    if (this.data.isEdit) {
      this.setData({
        isEdit: false,
        selectedList: []
      })

    }
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

  getFormid(e) {
    getFormid(e.detail.formId);
  },

  bindEdit() {
    this.setData({
      isEdit: !this.data.isEdit
    })
  },

  bindChecked(e) {
    this.setData({
      selectedList: e.detail.value
    })
  },

  changeStatus: async function() {
    let selectedList = this.data.selectedList;
    if (selectedList.length === 0) return;
    else if (selectedList.length > 20) {
      toast("暂不支持同时更改20条以上数据", "none");     
      return; 
    }
    let status;
    switch(this.data.tabIndex) {
      case 0: status="has-read";
        break;
      case 1: status="un-read";
        break;
    }
    let res = await notify.changeStatus(selectedList, status);
    if (res.code === 1) {
      res = await notify.download(this);
    }
  },

  delete: async function() {
    let selectedList = this.data.selectedList;
    if (selectedList.length === 0) return;
    else if (selectedList.length > 20) {
      toast("暂不支持同时更改20条以上数据", "none");     
      return; 
    }
    let res = await notify.deleteItems(selectedList);
    if (res.code === 1) {
      res = await notify.download(this);
    }
  }

})