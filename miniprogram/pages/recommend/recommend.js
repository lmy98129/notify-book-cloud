const rec = require("../../utils/recommend");

import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";


Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    recommendList: [],
    start: 1,
    pageLength: 9,
    isAllDownloaded: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let { mode, total } = options;
    let title, key;
    if (mode !== undefined && mode !== "" && total !== undefined && total !== "") {
      this.setData({ mode, total })
      switch(mode) {
        case "sameYearRecList":
          title = "同届校友";
          key = "degreeStartTime";
          break;
        case "sameMajorRecList":
          title = "同系同学";
          key = "major";
          break;
      }
      this.setData({ title, key });
    } else {
      wx.switchTab({
        url: "../profile/profile"
      })
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
    let { mode } = this.data;
    let tmpUserInfo = wx.getStorageSync("curUserProfile");
    let bgImgUrl = tmpUserInfo.bgImgUrl,
    nickname = tmpUserInfo.nickName;
    let recommendList = wx.getStorageSync(mode);
    this.setData({
      bgImgUrl,
      nickname,
      recommendList,
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


  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: async function () {
    try {
      let { start, pageLength, recommendList, 
        total, key, isAllDownloaded, mode } = this.data;
      if (isAllDownloaded) {
        return;
      }
      wx.showLoading({
        title: "加载中"
      });
      start += (pageLength+1);
      if (start < total) {
        let { recList, total } = await rec.same(key, start, pageLength);
        recommendList = recommendList.concat(recList);
        wx.setStorage({ key: mode, data: recommendList });
        this.setData({ recommendList, total, start });
      } else {
        isAllDownloaded = true;
        this.setData({ isAllDownloaded });
      }
      wx.hideLoading();
    } catch (error) {
      console.log(error.message);
      wx.hideLoading();      
    }
  },

})