// pages/search/search.js
const app = getApp();
const getFormid = require("../../utils/formid").getFormid;
const formid = require("../../utils/formid");
const toast = require("../../utils/message").toast;
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    inputVal: "",
    titleVal: "&nbsp;",
    searchRes: []
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
    formid.upload();
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
    // wx.setStorageSync("searchRes", []);
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
          titleVal: "&nbsp;",
          searchRes: []
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
    try {
      let value = this.data.inputVal;
      if (value === "" || value === undefined) {
        toast("搜索关键字不能为空", "none");
        return;
      }
      wx.showLoading({
        title: "搜索中"
      })
      let requestArray = [
        {
          text: value,
          keyArray: [
            "enterSchoolTime",
            "leaveSchoolTime",
            "homeTown",
            "institution",
            "realName",
            "major",
            "phoneNumber",
            "wechatId",
            "intro",
            "job",
            "content",
            "degree"
          ],
          weight: 4
        },
        {
          text: value,
          keyArray: [
            "birthDate",
            "jobStartTime",
            "nickName",
            "address"
          ],
          weight: 1
        }
      ];
      let res = await wx.cloud.callFunction({
        name: "search",
        data: {
          text: value,
          start: 0,
          pageLength: 50,
          requestArray,
          collection: "profile"
        }
      });
      wx.hideLoading();
      if (res.result.code === 1) {
        let searchRes = res.result.searchRes
        console.log("搜索成功", searchRes);
        this.setData({
          searchRes
        })
        if (searchRes.length === 0) {
          toast("搜索结果为空，请重新输入关键词","none");
        } else {
          wx.setStorageSync("searchResult", searchRes);
        }
      } else {
        toast("搜索请求出错", "none");
        console.log("搜索失败", res.result.err);
      }
    } catch (error) {
      wx.hideLoading();
      toast("搜索请求超时", "none");
      console.log("搜索失败", error);
    }
  },
  
  getFormid(e) {
    getFormid(e.detail.formId);

  }
})