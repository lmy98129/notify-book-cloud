const toast = require("./message").toast;
const app = getApp();

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

module.exports = {
  download: async (that) => {
    wx.showLoading({
      title: "加载中"
    })
    let tmpUserInfo = wx.getStorageSync("curUserProfile");
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
          that.setData({
            hasReadArray: [],
            unReadArray: []
          });
          wx.setStorageSync("hasReadArray", []);
          wx.setStorageSync("unReadArray", []);
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

  checkDownload: async () => {
    try {
      let msg = "暂无消息";
      let res = await wx.cloud.callFunction({
        name: "notification",
        data: {
          $url: "download"
        }
      });
      let code = res.result.code;
      switch(code) {
        case 0:
          wx.setStorageSync("hasReadArray", []);
          wx.setStorageSync("unReadArray", []);
          break;
        case 1: 
          let hasReadArray = res.result.hasReadArray,
            unReadArray = res.result.unReadArray;
          wx.setStorageSync("hasReadArray", hasReadArray);
          wx.setStorageSync("unReadArray", unReadArray);
          if (unReadArray.length > 0) {
            msg = "存在未读消息";
            code = 2;
          }
          break;
      }
      console.log("消息更新成功：", msg);
      return code;
    } catch (error) {
      console.log(error.message)
    }
  },

  changeStatus: async (idArray, status) => {
    try {
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
        toast("数据提交成功", "success");
        console.log("更改消息状态操作成功：", res.result);
      } else {
        toast("数据提交失败", "none");
        console.log("更改消息状态操作失败：", res.err);
      }
  
      return res.result;
    } catch (error) {
      console.log(error);
    }
  },

  deleteItems: async (idArray) => {
    try {
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
        toast("数据提交成功", "success");
        console.log("删除消息操作成功：", res.result);
      } else {
        toast("数据提交失败", "none");
        console.log("删除消息操作失败：", res.err);
      }
      
      return res.result;
    } catch (error) {
      console.log(error);
    }
  },

  adminDownload: async () => {
    try {
      wx.showLoading({
        title: "加载消息列表"
      })
      let res = await wx.cloud.callFunction({
        name: 'notification',
        data: {
          $url: 'adminDownload',
        }
      })
      
      wx.hideLoading();
  
      if (res.result.code === 1) {
        toast("列表加载成功", "success");
        console.log("推送消息管理列表加载成功：", res.result.notification);
        wx.setStorageSync("adminNotification", res.result.notification);
      } else {
        toast("列表加载失败", "none");
        console.log("推送消息管理列表加载失败：", res.err);
      }
  
      return res.result.notification;
    } catch (error) {
      console.log(error);
    }
  },

  adminUpdate: async (notifyDetail, id) => {
    try {
      wx.showLoading({
        title: "提交数据中"
      })
      let res = await wx.cloud.callFunction({
        name: "notification",
        data: {
          $url: "adminUpdate",
          id,
          notifyDetail
        }
      });
  
      wx.hideLoading();
  
      if (res.result.code === 1) {
        toast("数据提交成功", "success");
        console.log("推送消息更新成功：", res.result);
      } else {
        toast("数据提交失败", "none");
        console.log("推送消息更新失败：", res.err);
      }
    } catch (error) {
      console.log(error);
    }
  },

  adminDelete: async (idArray) => {
    try {
      wx.showLoading({
        title: "提交数据中"
      })
  
      let res = await wx.cloud.callFunction({
        name: "notification",
        data: {
          $url: "adminDelete",
          idArray
        }
      });
  
      wx.hideLoading();
  
      if (res.result.code === 1) {
        toast("数据提交成功", "success");
        console.log("删除消息操作成功：", res.result);
      } else {
        toast("数据提交失败", "none");
        console.log("删除消息操作失败：", res.err);
      }

      return res.result;
    } catch (error) {
      console.log(error);
    }
  },

  adminAdd: async (notifyDetail) => {
    try {
      wx.showLoading({
        title: "提交数据中"
      })
  
      let res = await wx.cloud.callFunction({
        name: "notification",
        data: {
          $url: "adminAdd",
          notifyDetail
        }
      });
  
      wx.hideLoading();
  
      if (res.result.code === 1) {
        toast("数据提交成功", "success");
        console.log("新建消息操作成功：", res.result);
      } else {
        toast("数据提交失败", "none");
        console.log("新建消息操作失败：", res.err);
      }
    } catch (error) {
      console.log(error);
    }
  }
}