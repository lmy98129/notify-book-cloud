const db = wx.cloud.database();
const toast = require("./message").toast;
const app = getApp();
const profile = require("./profile");
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const codeCheck = async (remark) => {
  try {
    let authCodeRes = await db.collection("auth-code").where({
      code: { $regex: remark },
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

      await db.collection("profile")
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
      toast("数据上传成功", "success");
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
    
    let uploadRes = await db.collection("profile").doc(curUserProfile._id).update({
      data: {
        authImgUrl: tmpAuthImgArray,
        authRemark: remark,
        authStatus: "auditing"
      }
    })

    wx.hideLoading();
    console.log("认证数据上传成功：", uploadRes);
    toast("数据上传成功", "success");

    curUserProfile.authStatus = "auditing";
    wx.setStorage({ key:"curUserProfile", data: curUserProfile });

    that.setData({
      authStatus: "auditing"
    });

    let notifyAdminRes = await wx.cloud.callFunction({
      name: "auditing",
      data: {
        $url: "notifyAdmin",
        collection: "profile",
      }
    })

    console.log(notifyAdminRes);

  } catch (error) {
    wx.hideLoading();
    console.log("认证数据上传失败：", error);
    toast("上传失败", "none");
  }
  
}

module.exports = {
  upload: uploadAuth,
  code: codeCheck
}