// pages/profile/profile.js
const sys = require("../../utils/system");
const profile = require("../../utils/profile");
const toast = require("../../utils/message").toast;
const bgImg = require("../../utils/bg-img");
const contact = require("../../utils/contact");
const app = getApp()
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

let index;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    specialPhone: '',
    avatarUrl: "/images/user-unlogin.png",
    bgImgUrl: "",
    nickName: "",
    profileStatus: "initial",
    mode: "normal",
    fixTop: false,
    fixVeryTop: false,
    tabIndex: 0,
    intro: "",
    isLoading: false,
    tabContent: ["基本资料", "自我介绍"],
    profileData: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
    let curUserProfile;
    curUserProfile = await profile.check();
    let { avatarUrl, nickName, bgImgUrl } = curUserProfile;
    if (avatarUrl !== undefined) {
      this.setData({ avatarUrl });
    }
    if (bgImgUrl !== undefined) {
      this.setData({ bgImgUrl })
    }
    if (nickName !== undefined) {
      this.setData({ nickName })
    }
    if (bgImgUrl === "" || bgImgUrl === undefined) {
      this.setData({
        bgImgUrl: app.globalData.DEFAULT_BGIMGURL
      })
    }
    if (curUserProfile.isProfileEmpty) {
      this.setData({
        profileStatus: "empty"
      })
    } else {
      let decodeRes = profile.decode(curUserProfile, this);
      let { intro, tmpIntro, profileStatus, ...profileData } = decodeRes;
      this.setData({
        intro, tmpIntro, profileStatus, profileData
      });
    }
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
      let that = this;
      wx.showActionSheet({
        itemList: ["上传自定义背景图片", "使用默认背景图片"],
        itemColor: "#333",
        success: async function(res) {
          switch(res.tapIndex) {
            case 0:
              await bgImg.upload(that);
              break;
            case 1:
              await bgImg.default(that);
              break;
          }
        }
      })
    }
  },

  editProfile: function() {
    if (wx.getStorageSync("curUserProfile").authStatus !== "authorized") {
      wx.navigateTo({
        url: "../auth/auth"
      })
    } else {
      wx.navigateTo({
        url: '../profile-edit/profile-edit',
      })
    }
  },

})