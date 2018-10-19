const toast = require("./message").toast;
const app = getApp();

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

module.exports = {
  download: async (that) => {
    wx.showLoading({
      title: "加载中"
    })
    let tmpUserInfo = wx.getStorageSync("userInfo");
    let bgImgUrl = tmpUserInfo.bgImgUrl,
    nickname = tmpUserInfo.nickName;
    that.setData({
      bgImgUrl,
      nickname
    });
    try {
      let res = await wx.cloud.callFunction({
        name: "notification",
        data: {
          $url: "download"
        }
      });
      switch(res.result.code) {
        case 0:
        case -1:
          // that.setData({
          //   isEmpty: true
          // });
          break;
        case 1: 
          let hasReadArray = res.result.hasReadArray,
            unReadArray = res.result.unReadArray;
          that.setData({
            hasReadArray,
            unReadArray,
          });
          wx.setStorageSync("hasReadArray", hasReadArray);
          wx.setStorageSync("unReadArray", unReadArray);
      }
      wx.hideLoading();
    } catch (error) {
      console.log(error)
    }
  },

  changeStatus: async (idArray, status) => {
    wx.showLoading({
      title: "提交数据中"
    })
    let res = await wx.cloud.callFunction({
      name: 'notification',
      data: {
        $url: 'changeStatus',
        idArray,
        status,
      }
    })

    wx.hideLoading();
    if (res.result.code === 1) {
      toast("数据提交成功");
      console.log("更改消息状态操作成功：", res.result);
    } else {
      toast("数据提交失败", "none");
      console.log("更改消息状态操作失败：", res.err);
    }

    return res.result;
  },

  deleteItems: async (idArray) => {
    wx.showLoading({
      title: "提交数据中"
    })

    let res = await wx.cloud.callFunction({
      name: 'notification',
      data: {
        $url: 'delete',
        idArray,
      }
    })
    
    wx.hideLoading();
    if (res.result.code === 1) {
      toast("数据提交成功");
      console.log("删除消息操作成功：", res.result);
    } else {
      toast("数据提交失败", "none");
      console.log("删除消息操作失败：", res.err);
    }
    
    return res.result;
  },

  adminDownload: async () => {
    wx.showLoading({
      title: "加载审核列表"
    })
    let res = await wx.cloud.callFunction({
      name: 'notification',
      data: {
        $url: 'adminDownload',
      }
    })
    
    wx.hideLoading();

    if (res.result.code === 1) {
      toast("列表加载成功");
      console.log("用户消息管理列表加载成功：", res.result.notification);
    } else {
      toast("列表加载失败", "none");
      console.log("用户消息管理列表加载失败：", res.err);
    }

    return res.result.notification;
  }
}