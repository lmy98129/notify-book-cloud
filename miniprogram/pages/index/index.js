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
    isProfileEmpty: 0
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
    /**
     * 这个条件涵盖了两个情况：
     * 1）若用户首次使用，则会在执行onShow时就跳转到了login页面，
     * 在login页面授权成功后，跳转回index页面，执行onShow，app.globalData.isFirstLogin === true，
     * 这时执行了login.getUserInfo()
     * 2）若用户是首次使用之后任意时刻第一次打开，则会执行到onShow，此时app.globalData.isFirstLogin === undefined，
     * 这时也执行了login.getUserInfo()
     * 3）以上两种情况都执行了login.getUserInfo()，并在此时设置app.globalData.isFirstLogin = false,
     * 保证之后打开页面时只读取本地存储而不去执行函数，相比定时器设计更灵活地减少了函数调用次数
     */
    // 感觉有点蠢，实在没办法实时更新啊，还是只保持第一种情况就算了。
    // 更蠢了，一直反复更新反而容易出问题。。。
    // if (app.globalData.isFirstLogin || app.globalData.isFirstLogin === undefined){
      await login.getUserInfo(this);
      
      // app.globalData.isFirstLogin = false;
    // } else {
    //   let tmpUserInfo = wx.getStorageSync("curUserProfile");
    //   let avatarUrl = tmpUserInfo.avatarUrl,
    //     nickname = tmpUserInfo.nickName,
    //     bgImgUrl = tmpUserInfo.bgImgUrl;
    //   this.setData({
    //     avatarUrl: avatarUrl,
    //     nickname: nickname,
    //     bgImgUrl: bgImgUrl,
    //   })
    // }
    // let isRedDotFlag = false;
    // if (wx.getStorageSync("authStatus")!==undefined 
    // && wx.getStorageSync("authStatus") === "unauthorized" ) {
    //   this.setData({
    //     isRedDot: true,
    //     isAuthRedDot: true,
    //   })
    //   isRedDotFlag = true;
    // } else {
    //   this.setData({
    //     isAuthRedDot: false
    //   })
    // }
    // if (wx.getStorageSync("unReadArray")!==undefined 
    // && wx.getStorageSync("unReadArray").length > 0) {
    //   this.setData({
    //     isRedDot: true,
    //     isNotifyRedDot: true
    //   })
    //   isRedDotFlag = true
    // } else {
    //   this.setData({
    //     isNotifyRedDot: false
    //   })
    // }
    // if (!isRedDotFlag) {
    //   this.setData({
    //     isRedDot: false,
    //     isAuthRedDot: false,
    //     isNotifyRedDot: false
    //   })
    // }
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
  }

})
