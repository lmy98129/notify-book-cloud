// bg-img.js
const db = wx.cloud.database();
const toast = require("./message").toast;
const profile = require("./profile");
const app = getApp();

const defaultImgUrl = app.globalData.DEFAULT_BGIMGURL;

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";


/**
 * 总而言之一切需要反复访问数据库的东西都不能存在，包括你
 */
const checkImg = () => {
  let msg = {};

  return db.collection("profile").where({
    _openid: app.globalData.openid
  }).get()
  .then(res => {
    if (res.data.length === 0 || res.data[0].bgImgUrl === undefined || res.data[0].bgImgUrl === "") {
      msg = {
        code: 0,
        msg: "use default bgImg",
        data: defaultImgUrl
      }
      return Promise.resolve(msg);
    } else {
      msg = {
        code: 1,
        msg: "use custom bgImg",
        data: res.data[0].bgImgUrl
      }
      return Promise.resolve(msg);
    }
  })
  .catch(err => {
    wx.setStorageSync("bgImgUrl", defaultImgUrl);
    msg = {
      code: -1,
      msg: "check bgImg failed",
      err: err
    }
    return Promise.reject(msg);
  })
}


const defaultImg = async (that) => {
  let curUserProfile = await profile.check();
  let curBgImgUrl = curUserProfile.bgImgUrl;

  if (curBgImgUrl === defaultImgUrl) {
    toast("当前正在使用默认背景", "none")
  } else {
    wx.showLoading({
      title: "更新背景图片中"
    });

    try {
  
      await db.collection("profile-new").doc(curUserProfile._id).update({
        data: {
          bgImgUrl: defaultImgUrl,
          isBgImgCustomed: false
        }
      })

      let deleteRes = await wx.cloud.deleteFile({
        fileList: [curBgImgUrl]
      })

      wx.hideLoading();
      console.log("更新背景图片成功：", deleteRes);
      toast("更新背景成功");

      // 更新本地存储的userInfo
      curUserProfile.bgImgUrl = defaultImgUrl;
      curUserProfile.isBgImgCustomed = false;
      wx.setStorage({ key: "curUserProfile", data: curUserProfile});
      console.log(wx.getStorageSync("curUserProfile"));

      // 更新当前页面中的头像图片地址
      that.setData({
        bgImgUrl: defaultImgUrl
      })
      
    } catch (error) {
      wx.hideLoading();
      console.log("更新背景图片失败：", error.message);
      toast("更新背景图片失败", "none");
    }

  }
}

const uploadImg = (that) => {
  let bgImgUrl;
  // 选取图片文件
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async function(res) {
      wx.showLoading({
        title: "图片上传中",
      })

      let curUserProfile = await profile.check();
      const curBgImgUrl = curUserProfile.bgImgUrl;
      // 上传图片文件到云存储
      const filePath = res.tempFilePaths[0];
      const openid = app.globalData.openid;
      const cloudPath = "bgImg/bgImg-" + openid + (new Date()).getTime() + filePath.match(/\.[^.]+?$/)[0];
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: async res => {
          try {
            console.log("上传自定义背景图成功：", res);
            bgImgUrl = res.fileID;
            
            let updateRes = await db.collection("profile-new").doc(curUserProfile._id).update({
              data: { 
                bgImgUrl,
                isBgImgCustomed: true
              }
            })
    
            if (curBgImgUrl !== defaultImgUrl) {
              wx.cloud.deleteFile({
                fileList: [curBgImgUrl]
              })
            }
    
            wx.hideLoading();
            console.log("更新自定义背景图成功：", updateRes);
            toast("上传自定义背景成功");
    
            // 更新本地存储的userInfo
            curUserProfile.bgImgUrl = bgImgUrl;
            curUserProfile.isBgImgCustomed = true;
            wx.setStorage({ key: "curUserProfile", data: curUserProfile});
    
            // 更新当前页面中的头像图片地址
            that.setData({
              bgImgUrl: bgImgUrl
            })
            
          } catch (error) {
            wx.hideLoading();
            console.log("更新自定义背景图失败：", error.message);
            toast("上传失败", "none");
          }
        },
        fail: err => {
          wx.hideLoading();
          console.log('上传自定义背景图失败：', err)
          toast("上传失败", "none");
        }
      })
        
    }
  })
}

module.exports = {
  check: checkImg,
  default: defaultImg,
  upload: uploadImg
}