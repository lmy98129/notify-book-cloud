// pages/auditing/auditing.js
const auditing = require("../../utils/auditing");
const toast = require("../../utils/message").toast;
import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    auditingList: [],
    tabIndex: 0,
    selectedList: [],
    tabContent: ["审核列表", "邀请码管理"],
    authCodeList: [],
    selectedAuthCodeList: [],
    isAuthCodeModalHidden: true,
    newAuthCode: "",
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
    let curUserProfile = wx.getStorageSync("curUserProfile");
    if (curUserProfile === undefined || curUserProfile.isAdmin === false) {
      wx.switchTab({
        url: "../profile/profile",
      }); 
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    let auditingList = await auditing.download(this); 
    wx.setStorageSync("auditingList", auditingList); 
    this.setData({
      auditingList
    })
    let authCodeList = await auditing.downloadAuthCode();
    wx.setStorageSync("authCodeList", authCodeList);
    this.setData({
      authCodeList
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

  tabHandler(e) {
    let index = parseInt(e.detail.index);
    this.setData({
      tabIndex: index
    })
  },

  bindChecked(e) {
    this.setData({
      selectedList: e.detail.value
    })
  },

  bindSelectAuthCode(e) {
    this.setData({
      selectedAuthCodeList: e.detail.value,
    })
  },

  goDetail(e) {
    wx.navigateTo({
      url: "../auditing-detail/auditing-detail?index=" + e.target.dataset.index
    })
  },

  allow: async function () {
    let length = this.data.selectedList.length
    if (length === 0) {
      return;
    } else if (length > 20) {
      toast("暂不支持同时更改20条以上数据", "none");
      return;
    }
    let res = await auditing.allow(this.data.selectedList);
    if (res.code === 0) {
      res = await auditing.download(this); 
      wx.setStorageSync("auditingList", res); 
      this.setData({
        auditingList: res
      })
    }
  },

  disallow: async function() {
    let length = this.data.selectedList.length
    if (length === 0) {
      return;
    } else if (length > 20) {
      toast("暂不支持同时更改20条以上数据", "none");
      return;
    }
    let res = await auditing.disallow(this.data.selectedList);
    if (res.code === 0) {
      res = await auditing.download(this); 
      wx.setStorageSync("auditingList", res); 
      this.setData({
        auditingList: res
      })
    }
  }, 

  modalTouchMove(e) {

  },

  showAuthCodeModal() {
    this.setData({
      isAuthCodeModalHidden: false,
      newAuthCode: ""
    })
  },

  hideAuthCodeModal() {
    this.setData({
      isAuthCodeModalHidden: true,
      newAuthCode: ""
    })
  },

  setNewAuthCode(e) {
    let { value } = e.detail;
    this.setData({
      newAuthCode: value,
    })
  },

  addAuthCode: async function(e) {
    try {
      let authCodeList = [];
      let { newAuthCode } = this.data;
      if (newAuthCode.length <= 0) {
        toast("新邀请码不能为空", "none");
        return;
      }
      wx.showLoading({
        title: "上传数据中",
      });
      authCodeList.push({
        code: newAuthCode
      });
      let addRes = await wx.cloud.callFunction({
        name: "auditing",
        data: {
          $url: "addAuthCode",
          authCodeList,
        }
      })

      wx.hideLoading();
      if (addRes.result) {
        let { code } = addRes.result;
        switch(code) {
          case 1:
            toast("添加成功", "success");
            authCodeList = await auditing.downloadAuthCode();
            wx.setStorageSync("authCodeList", authCodeList);
            this.setData({
              authCodeList,
            });
            this.hideAuthCodeModal()
            break;
          case -1:
            toast("添加新邀请码失败", "none");
            break;
        }
      }

    } catch (error) {
      wx.hideLoading();
      toast("添加新邀请码失败", "none");
      console.log(error.message);
    }
  },

  deleteAuthCode: async function() {
    try {
      let { selectedAuthCodeList } = this.data;
      if (selectedAuthCodeList.length <= 0) {
        toast("请至少选择一项", "none");
        return;
      }
      wx.showLoading({
        title: "删除数据中",
      })
      let idList = selectedAuthCodeList;
      let deleteRes = await wx.cloud.callFunction({
        name: "auditing",
        data: {
          $url: "deleteAuthCode",
          idList,
        }
      })
      wx.hideLoading();
  
      if (deleteRes.result) {
        let { code } = deleteRes.result;
        switch(code) {
          case 1:
            toast("删除成功", "success");
            let authCodeList = await auditing.downloadAuthCode();
            wx.setStorageSync("authCodeList", authCodeList);
            this.setData({
              authCodeList
            });
            break;
          case -1:
            toast("删除失败", "none");
            break;
        }
      }
      
    } catch (error) {
      wx.hideLoading();
      toast("删除失败", "none");
      console.log(error.message);
    }
  }

})