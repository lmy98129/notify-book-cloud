const db = wx.cloud.database();
const toast = require("./message").toast;
const app = getApp();
const profile = require("./profile");
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

/**
 * @todo 只在login.getUserInfo中出现过，改造结束后即可废弃
 */
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
    let authCodeRes = await db.collection("auth-code").where({
      code: remark
    }).get();

    if (authCodeRes.data === undefined || authCodeRes.data.length === 0) {
      return Promise.resolve({
        code: 0,
        msg: "not auth-code"
      });
    } else {
  
      let curUserProfile = await profile.check();

      let data = {
        authStatus: "authorized",
        authIsCode: true,
      }

      await db.collection("profile-new")
        .doc(curUserProfile._id).update({ data });
  
      curUserProfile.authIsCode = data.authIsCode;
      curUserProfile.authStatus = data.authStatus;
      wx.setStorage({ key: "curUserProfile", data: curUserProfile });

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
  let tmpAuthImgArray = [], cloudPath, filePath, openid = app.globalData.openid;
  try {
    let res = await codeCheck(remark);
    if (res.code === 1) {
      wx.hideLoading();
      console.log("授权码检测成功：", res.msg);
      toast("数据上传成功");
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

  try {
    if (that.data.authImgArray.length === 0) {
      toast("请至少上传一张图片", "none");
      return;
    }

    wx.showLoading({
      title: "数据上传中"
    });

    for (let i=0; i<authImgArray.length; i++) {
      filePath = authImgArray[i];
      cloudPath = "authImg/authImg-"+ openid + (new Date()).getTime() + filePath.match(/\.[^.]+?$/)[0];
      // 用await关键字异步转同步
      let uploadFileRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath,
      })
      tmpAuthImgArray.push(uploadFileRes.fileID);
    }

    let curUserProfile = await profile.check();
    
    let uploadRes = await db.collection("profile-new").doc(curUserProfile._id).update({
      data: {
        authImgUrl: tmpAuthImgArray,
        authRemark: remark,
        authStatus: "auditing"
      }
    })

    wx.hideLoading();
    console.log("认证数据上传成功：", uploadRes);
    toast("数据上传成功");

    curUserProfile.authStatus = "auditing";
    wx.setStorage({ key:"curUserProfile", data: curUserProfile });

    that.setData({
      authStatus: "auditing"
    });

  } catch (error) {
    wx.hideLoading();
    console.log("认证数据上传失败：", error);
    toast("上传失败", "none");
  }
  
}

module.exports = {
  check: checkAuth,
  upload: uploadAuth,
  code: codeCheck
}