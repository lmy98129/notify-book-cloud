//index.js
const app = getApp()
const localData = require("../../test/local-data");
const sys = require("../../utils/system");
const login = require("../../utils/login");
const formid = require("../../utils/formid");
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
    possibleKnowListLength: 0,
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

    // 导入可能认识的人信息
    // let rand = localData.rand;
    // this.setData({
    //   randListLength: rand.length
    // })
    // if (rand.length < 9) {
    //   for (var i=rand.length; i<9; i++) {
    //     rand[i] = {avatarUrl: "/images/user-unlogin.png"}
    //   }
    // }
    // let year = localData.year, classmate = localData.classmate;
    // this.setData({
    //   randRecList: rand,
    //   sameYearRecList: year, 
    //   sameClassRecList: classmate
    // })

    sys.checkPhone(this);

    // setInterval(() => {
    //   login.download();
    // }, 10000)

  },

  onShow: async function() {
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

  goSearch() {
    if (wx.getStorageSync("curUserProfile").authStatus !== "authorized") {
      wx.navigateTo({
        url: "../auth/auth"
      })
    } else {
      wx.navigateTo({
        url: "../search/search"
      })
    }
  },

  changePossibleKnow: async function() {
    this.setData({
      isChangePossibleKnowLoading: true,
      changeBtnWord: ""
    })
    await login.possibleKnow(this);
    this.setData({
      isChangePossibleKnowLoading: false,
      changeBtnWord: "换一批"
    })
  }

})
