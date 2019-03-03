// pages/profile/profile.js
const sys = require("../../utils/system");
const profile = require("../../utils/profile");
const toast = require("../../utils/message").toast;
const bgImg = require("../../utils/bg-img");
const contact = require("../../utils/contact");
const app = getApp()
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

let mode = "normal", index;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    specialPhone: '',
    avatarUrl: "/images/user-unlogin.png",
    bgImgUrl: "",
    nickName: "",
    profileStatus: 0,
    fixTop: false,
    fixVeryTop: false,
    tabIndex: 0,
    introStatus: "default",
    intro: "",
    tmpIntro: "",
    mode: "normal",
    addFriend: "添加到通讯录",
    isLoading: false,
    tabContent: ["基本资料", "自我介绍"],
    profileData: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.mode !== undefined) {
      mode = options.mode;
      this.setData({
        mode
      })
    }
    if (options.index !== undefined) {
      index = options.index;
      this.setData({
        index
      })
    }
    if (mode === "searchResult") {
      let curUserProfile = wx.getStorageSync("searchResult")[index];
      let openid = wx.getStorageSync("openid");
      if (curUserProfile._openid === openid) {
        mode = "normal";
        this.setData({
          mode: "normal"
        })
      }
    }
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
  onShow: async function () {
    // 若非用户本人
    let curUserProfile;
    if (mode !== "normal") {
      curUserProfile = wx.getStorageSync(mode)[index];
    } else {
      curUserProfile = await profile.check();
    }
    if (curUserProfile === undefined) {
      wx.switchTab({
        url: "../profile/profile"
      });
      return;
    }
    let { avatarUrl = app.globalData.DEFAULT_AVATARURL, 
      nickName = "", bgImgUrl = app.globalData.DEFAULT_BGIMGURL } = curUserProfile;
    this.setData({ avatarUrl, bgImgUrl, nickName });
    if (curUserProfile.isProfileEmpty) {
      this.setData({
        profileStatus: "empty"
      })
    } else {
      let isShowUserInfo = ["phoneNumber", "wechatId", "realName"], 
        isShowContactArray = false, isShowJobArray = false, isShowDegreeArray = false;
      if (mode === "tmpInitProfile" || mode === "profileManageDataTmp") {
        isShowUserInfo = undefined;
        isShowContactArray = true;
        isShowJobArray = true;
        isShowDegreeArray = true;
      }
      let decodeRes = profile.decode(curUserProfile, isShowUserInfo);
      let { intro, profileStatus, ...profileData } = decodeRes;
      profileData = {
        ...profileData,
        isShowJobArray,
        isShowContactArray,
        isShowDegreeArray,
      }
      if (intro !== undefined) {
        this.setData({ intro });
      }
      this.setData({
        profileStatus, profileData
      });
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
    index = undefined;
    mode = "normal";
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

  tabHandler(e) {
    let index = parseInt(e.detail.index);
    this.setData({
      tabIndex: index
    })
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

  customBgImg() {
    if (wx.getStorageSync("curUserProfile").authStatus !== "authorized") {
      wx.navigateTo({
        url: "../auth/auth"
      })
    } else {
      let { mode, index } = this.data
      let that = this;
      wx.showActionSheet({
        itemList: ["上传自定义背景图片", "使用默认背景图片"],
        itemColor: "#333",
        success: async function(res) {
          switch(res.tapIndex) {
            case 0:
              if (mode !== undefined && mode === "profileManageDataTmp") {
                await bgImg.uploadForManage(that, mode, index);
              } else {
                await bgImg.upload(that);
              }
              break;
            case 1:
              if (mode !== undefined && mode === "profileManageDataTmp") {
                await bgImg.defaultForManage(that, mode, index);              
              } else {
                await bgImg.default(that);
              }
              break;
          }
        }
      })
    }
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }, 


  editProfile: function() {
    let { mode, index } = this.data;
    if (wx.getStorageSync("curUserProfile").authStatus !== "authorized") {
      wx.navigateTo({
        url: "../auth/auth"
      })
    } else if (mode !== undefined && mode === "profileManageDataTmp"){
      wx.navigateTo({
        url: "../profile-edit/profile-edit?mode=profileManageDataTmp&index="+index
      })
    } else {
      wx.navigateTo({
        url: '../profile-edit/profile-edit',
      })
    }
  },

})