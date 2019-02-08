const app = getApp();
const toast = require("./message").toast;

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

let { DEFAULT_AVATARURL, DEFAULT_BGIMGURL } = app.globalData;

const download = async (start, pageLength) => {
  try {
    let manageRes = await wx.cloud.callFunction({
      name: "search",
      data: {
        $url: "manage",
        collection: "profile-test",
        query: "ALL",
        start,
        pageLength,
      }
    });
    
    if (manageRes.result !== undefined) {
      switch(manageRes.result.code) {
        case 1:
          let { result } = manageRes;
          let { searchRes, start, total } = result;
          return {
            code: 1,
            result: searchRes,
            start,
            total,
          }
          break;
        case -1:
          return {
            code: -1,
            err: manageRes.result.err
          }
          break;
      }
    } else {
      return {
        code: -1
      }
    }
    
  } catch (error) {
    console.log(error);
    return {
      code: -1,
      err: error.message
    }
  }
}

const deleteProfile = async (mode, index) => {
  try {
    wx.showLoading({
      title: "删除用户资料中",
    });

    let profiles = wx.getStorageSync(mode);
    let { _id, avatarUrl, bgImgUrl, authImgUrl } = profiles[index];

    await wx.cloud.callFunction({
      name: "profile-manage",
      data: {
        $url: "deleteProfile",
        _id,
        collection: "profile-test",
      }
    })

    let fileList = [];

    if (avatarUrl !== undefined && avatarUrl !== "" 
    && avatarUrl !== DEFAULT_AVATARURL) {
      fileList.push(avatarUrl)
    }

    if (bgImgUrl !== undefined && bgImgUrl !== "" 
    && bgImgUrl !== DEFAULT_BGIMGURL) {
      fileList.push(bgImgUrl)
    }

    if (authImgUrl !== undefined && authImgUrl.length !== undefined 
    && authImgUrl.length > 0) {
      fileList.concat(authImgUrl)
    }

    let deleteRes = wx.cloud.deleteFile({
      fileList
    })

    wx.hideLoading();
    console.log("删除用户资料成功", deleteRes);
  } catch (error) {
    wx.hideLoading();
    console.log("删除用户资料失败", error.message);
    toast("删除用户资料失败", "none");
  }
}

module.exports = {
  download,
  deleteProfile
}