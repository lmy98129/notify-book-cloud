// pages/profile/profile.js
const sys = require("../../utils/system");
const profile = require("../../utils/profile");
const toast = require("../../utils/message").toast;
const bgImg = require("../../utils/bg-img");
const contact = require("../../utils/contact");
const app = getApp()
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

let mode = "normal", index, isFriend;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    specialPhone: '',
    avatarUrl: "/images/user-unlogin.png",
    bgImgUrl: "",
    nickName: "",
    userInfo: [],
    contactArray: [],
    jobArray: [],
    degreeArray: [],
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
    if (mode !== "normal") {
      let curUserProfile = wx.getStorageSync(mode)[index];
      try {
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
        let res = await contact.check(curUserProfile._openid);
        profile.decode(curUserProfile, this); 
        if (res.code === 0) {
          console.log("获取用户资料成功：", res.msg);
          this.setData({
            addFriend: "添加到通讯录",
          })
          isFriend = false;
        } else if (res.code === 1) {
          console.log("获取用户资料成功：", res.msg);
          this.setData({
            addFriend: "取消关注"
          })
          isFriend = true;
        } else {
          console.log("获取用户资料出错：", res.error);
        }
      } catch (error) {
        console.log("获取用户资料出错：", error);
        this.setData({
          profileStatus: -2
        })
      }
    } else {
      // 如果资料内容所有者正是用户本人
      let curUserProfile = await profile.check();
      let { avatarUrl, nickName, bgImgUrl } = curUserProfile;
      this.setData({
        avatarUrl,
        nickName,
        bgImgUrl
      })
      if (curUserProfile.isProfileEmpty) {
        this.setData({
          profileStatus: -1
        })
      } else {
        profile.decode(curUserProfile, this);
      }
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
    isFriend = undefined;
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
    let index = parseInt(e.target.dataset.index), that = this;
    this.setData({
      tabIndex: index
    })
  },

  bindSwiper(e) {
    let index = e.detail.current, that = this;
    this.setData({
      tabIndex: index
    });
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

  addIntro() {
    this.setData({
      introStatus: "editing"
    })
  },

  cancelIntro() {
    this.setData({
      introStatus: "default",
    })
  },

  introInput(e) {
    this.setData({
      tmpIntro: e.detail.value
    })
  },
  
  submitIntro() {
    let { tmpIntro, mode, index } = this.data
    if (mode === "profileManageDataTmp") {
      profile.introUploadForManage(this, tmpIntro, mode, index);
    } else {
      profile.introUpload(this, tmpIntro);
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

  addFriend: async function() {
    try {
      let openid;
      if (mode === "searchResult") {
        openid = wx.getStorageSync("searchResult")[index]._openid;
      } else if (mode === "contactResult") {
        openid = wx.getStorageSync("contactResult")[index]._openid;
      }
      this.setData({
        isLoading: true,
        addFriend: "数据上传中"
      })
      if(!isFriend) {
        let res = await contact.add(openid);
        if (res.code === 0) {
          console.log("数据上传成功", res);
          this.setData({
            isLoading: false,
            addFriend: "取消关注",
          })
          isFriend = true;
        } else if (res.code === -1) {
          this.setData({
            isLoading: false,
            addFriend: "添加到通讯录",
          })
          toast("数据上传出错", "none");
          console.log("数据上传出错", res.error);
        }
      } else {
        let tmpArray = [];
        tmpArray.push(openid);
        let res = await contact.del(tmpArray);
        if (res.code === 0) {
          console.log("数据上传成功", res);
          this.setData({
            isLoading: false,
            addFriend: "添加到通讯录",
          })
          isFriend = false;
        } else if (res.code === -1) {
          this.setData({
            isLoading: false,
            addFriend: "取消关注",
          })
          toast("数据上传出错", "none");
          console.log("数据上传出错", res.error);
        }
      }
    } catch (error) {
      toast("数据上传出错", "none");
      console.log("数据上传出错", error);
    }
  }

})