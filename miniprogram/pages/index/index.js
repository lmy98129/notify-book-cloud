//index.js
const sys = require("../../utils/system");
const login = require("../../utils/login");
const toast = require("../../utils/message").toast;

const app = getApp();
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";


Page({
  data: {
    avatarUrl: "/images/user-unlogin.png",
    bgImgUrl: "",
    nickName: "",
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    sideBar: false,
    moveY: 0,
    possibleKnowList: [],
    sameYearRecList: [],
    sameYearFixList: [],
    sameMajorRecList: [],
    sameMajorFixList: [],
    sameYearSwiperCurrent: 0,
    sameMajorSwiperCurrent: 0,
    possibleKnowListTotal: 0,
    possibleKnowListStart: 0,
    fixTop: false,
    fixVeryTop: false,
    specialPhone: '',
    realname: "",
    isRedDot: false,
    isAuthRedDot: false,
    isNotifyRedDot: false,
    isProfileEmpty: 0,
    isChangePossibleKnowLoading: false,
    changeBtnWord: "换一批"
  },

  onLoad: function() {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return;
    }
    
    sys.checkPhone(this);

  },

  onShow: async function() {
    if (app.globalData.isProfileUpdated) {
      app.globalData.isProfileUpdated = false;
      that.setData({
        sameYearSwiperCurrent: 0,
        sameMajorSwiperCurrent: 0,
      })
    }
    await login.getUserInfo(this);
  },


  switchSideBar: function() {
    if (this.data.fixVeryTop) {
      this.setData({
        fixVeryTop: false,
      })
    }
    let sideBar = !this.data.sideBar;
    this.setData({
      sideBar: sideBar
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

  goNotification() {
    wx.navigateTo({
      url: "../notification/notification"
    });
  },

  changePossibleKnow: async function() {
    try {
      this.setData({
        isChangePossibleKnowLoading: true,
        changeBtnWord: ""
      })
      let { possibleKnowListTotal, possibleKnowListStart } = this.data;
      let start = possibleKnowListStart + 9;
      if (start > possibleKnowListTotal) {
        start = 0;
        this.setData({
          possibleKnowListStart: 0
        })
      }
      await login.possibleKnow(this, start, 9);
      this.setData({
        isChangePossibleKnowLoading: false,
        changeBtnWord: "换一批"
      })
      toast("推荐列表刷新成功", "none");
    } catch (error) {
      this.setData({
        isChangePossibleKnowLoading: false,
        changeBtnWord: "换一批"
      })
      toast("推荐列表加载失败", "none");
      console.log(error.message);
    }
  },

  goPossibleKnowProfile(e) {
    let { index } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../profile-other/profile-other?mode=possibleKnowList&index=${index}`
    })
  }
})
