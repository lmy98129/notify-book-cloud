// pages/notification-manage-edit/notification-manage-edit.js
const confirmOnly = require("../../utils/message").confirmOnly;
const notify = require("../../utils/notification");
const db = wx.cloud.database()
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    notifyDetail: {},
    title: "",
    content: "",
    userList: "",
    mode: "",
    special: "",
    id: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      mode: options.mode
    })
    if (options.mode === "edit") {
      let notifyDetail = wx.getStorageSync("adminNotification")[options.index]
      this.setData({
        title: notifyDetail.title,
        content: notifyDetail.content,
        id: notifyDetail._id
      })
      if (notifyDetail.special !== undefined && notifyDetail.special !== "") {
        this.setData({
          special: notifyDetail.special
        })
      }
      if (notifyDetail.userList !== undefined && notifyDetail.userList !== "0") {
        if (typeof notifyDetail.userList === "string") {
          notifyDetail.userList = [notifyDetail.userList]
        }
        this.setData({
          userList: notifyDetail.userList.join("，")
        })
      }
    }
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

  inputHandler(e) {
    let inputType;
    if (e.detail.inputType !== undefined) {
      inputType = e.detail.inputType;
    } else if (e.target.dataset.inputType !== undefined) {
      inputType = e.target.dataset.inputType;
    }
    this.setData({
      [inputType]: e.detail.value
    })
  },

  submit: async function() {
    if (this.data.special !== "" && this.data.userList !== "") {
      confirmOnly("特殊类型消息（如审核成功、审核未成功）暂不支持设置覆盖特定用户");
      this.setData({
        userList: ""
      })
      return;
    } 
    if (this.data.content === "") {
      confirmOnly("推送内容为空，此项为必填项");
      return;
    }
    if (this.data.content === "") {
      confirmOnly("推送标题为空，此项为必填项");
      return;
    }
    let newNotifyDetail = {};
    newNotifyDetail.title = this.data.title;
    newNotifyDetail.content = this.data.content;
    if (this.data.mode === "edit") {
      if (this.data.special === "") {
        if (this.data.userList !== "") {
          newNotifyDetail.userList = this.data.userList.split("，");
          for (let i=0; i<newNotifyDetail.userList.length; i++) {
            if (newNotifyDetail.userList[i] === "") {
              newNotifyDetail.userList = newNotifyDetail.userList.splice(i-1,1);
            }
          }
        } else {
          newNotifyDetail.userList = "0";
        }
      } else {
        newNotifyDetail.userList = "0";
      }
      await notify.adminUpdate(newNotifyDetail, this.data.id);
    } else if (this.data.mode === "new") {
      if (this.data.userList !== "") {
        newNotifyDetail.userList = this.data.userList.split("，");
      } else {
        newNotifyDetail.userList = "0";
      }
      await notify.adminAdd(newNotifyDetail);
    }
  }
})