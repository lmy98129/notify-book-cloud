const db = wx.cloud.database();
const toast = require("./message").toast;
const app = getApp();
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const checkAuth = () => {
  let msg = {};

  return (db.collection("auth").where({
    _openid: app.globalData.openid
  }).get()
  .then(res => {
    if (res.data.length === 0) {
      // 首次登录，自动添加认证记录
      return db.collection("auth").add({
        data: {
          authImgUrl: "",
          remark: "",
          status: "unauthorized",
          isCode: false
        }
      }).then(res => {
        msg = {
          code: 1,
          msg: "new unauthorized record added",
          status: "unauthorized"
        }
        return Promise.resolve(msg);
      })
    } else {
      switch (res.data[0].status) {
        case "unauthorized":
          // 未提交审核
          msg = {
            code: 1,
            msg: "still unauthorized",
          }
          break;
        case "auditing":
          // 审核中
          msg = {
            code: 2,
            msg: "still auditing"
          }
          break;
        case "authorized": 
          // 审核通过
          msg = {
            code: 3,
            msg: "authorized"
          }
          break;
      }
      msg.status = res.data[0].status;
      return Promise.resolve(msg);
    }
  }))
}

const codeCheck = async (remark) => {
  try {
    let res = await db.collection("auth-code").where({
      code: remark
    }).get();

    if (res.data.length === 0) {
      return Promise.resolve({
        code: 0,
        msg: "not auth-code"
      });
    } else {
  
      res = await db.collection("auth").where({
        _openid: wx.getStorageSync("openid")
      }).get();
  
      res = await db.collection("auth").doc(res.data[0]._id).update({
        data: {
          status: "authorized",
          isCode: true,
        }
      });
  
      return Promise.resolve({
        code: 1,
        msg: "is auth-code & authorized",
      });
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

const uploadAuth = async (authImgArray, remark, that) => {
  let tmpAuthImgArray = [], cloudPath, filePath, openid = wx.getStorageSync("openid");
  try {
    let res = await codeCheck(remark);
    if (res.code === 1) {
      wx.hideLoading();
      console.log("授权码检测成功：", res.msg);
      toast("数据上传成功");
      wx.setStorageSync("authStatus", "authorized");
      that.setData({
        authStatus: "authorized"
      });
      return;
    } else {
      console.log("非授权码：", res.msg);
    }
  } catch (error) {
    wx.hideLoading();
    console.log("认证数据上传失败", error);
    toast("上传失败", "none");
    return;
  }

  if (that.data.authImgArray.length === 0) {
    toast("请至少上传一张图片", "none");
    return;
  }

  wx.showLoading({
    title: "数据上传中"
  });
  (async () => {
    for (let i=0; i<authImgArray.length; i++) {
      filePath = authImgArray[i];
      cloudPath = "authImg-"+ openid + (new Date()).getTime() + filePath.match(/\.[^.]+?$/)[0];
      // 用await关键字异步转同步
      await wx.cloud.uploadFile({
        cloudPath,
        filePath,
      })
      .then(res => {
        tmpAuthImgArray.push(res.fileID);
      })
    }
  })().then(() => {
    return db.collection("auth").where({
        _openid: openid
      }).get()
  })
  .then(res => {
    return db.collection("auth").doc(res.data[0]._id).update({
      data: {
        authImgUrl: tmpAuthImgArray,
        remark: remark,
        status: "auditing"
      }
    })
  })
  .then(res => {
    wx.hideLoading();
    console.log("认证数据上传成功：", res);
    toast("数据上传成功");
    
    wx.setStorageSync("authStatus", "auditing");
    that.setData({
      authStatus: "auditing"
    });
  })
  .catch(err => {
    wx.hideLoading();
    console.log("认证数据上传失败：", err);
    toast("上传失败", "none");
  })
  
}

module.exports = {
  check: checkAuth,
  upload: uploadAuth,
  code: codeCheck
}