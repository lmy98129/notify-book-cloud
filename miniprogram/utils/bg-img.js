// bg-img.js
const db = wx.cloud.database();
const toast = require("./message").toast;
const defaultImgUrl = "cloud://test-5c133c.7465-test-5c133c/tvs-bg.jpg";

const checkImg = () => {
  let msg = {};

  return db.collection("profile").where({
    _openid: wx.getStorageSync("openid")
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

const defaultImg = (that) => {
  let curBgImgUrl = wx.getStorageSync("userInfo").bgImgUrl;
  if (curBgImgUrl === defaultImgUrl) {
    toast("当前正在使用默认背景", "none")
  } else {
    wx.showLoading({
      title: "更新背景图片中"
    });
    let openid = wx.getStorageSync("openid");
    db.collection("profile").where({
      _openid: openid
    }).get()
    // 更新该记录
    .then(res => {
      return db.collection("profile").doc(res.data[0]._id).update({
        data: {
          bgImgUrl: ""
        }
      })
    })
    // 删除原文件
    .then(res => {
      return wx.cloud.deleteFile({
        fileList: [curBgImgUrl]
      })
    })
    // 结束任务
    .then(res => {
      wx.hideLoading();
      console.log("更新背景图片成功：", res);
      toast("更新背景成功");

      // 更新本地存储的userInfo
      let tmpUserInfo = wx.getStorageSync("userInfo");
      tmpUserInfo.bgImgUrl = defaultImgUrl;
      wx.setStorageSync("userInfo", tmpUserInfo);

      // 更新当前页面中的头像图片地址
      that.setData({
        bgImgUrl: defaultImgUrl
      })
    })
    // 捕获错误
    .catch(err => {
      wx.hideLoading();
      console.log("更新背景图片失败：", err);
      toast("更新背景图片失败", "none");
    })
  }
}

const uploadImg = (that) => {
  let bgImgUrl;
  // 选取图片文件
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: function(res) {
      wx.showLoading({
        title: "图片上传中",
      })

      const curBgImgUrl = wx.getStorageSync("userInfo").bgImgUrl;
      // 上传图片文件到云存储
      const filePath = res.tempFilePaths[0];
      const openid = wx.getStorageSync("openid");
      const cloudPath = "bgImg-" + openid + (new Date()).getTime() + filePath.match(/\.[^.]+?$/)[0];
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
      })
      // 上传图片成功
      .then(res => {
        console.log("上传自定义背景图成功：", res);
        bgImgUrl = res.fileID;

        // 更新profile数据库记录
        // 查询记录的_id
        return db.collection("profile").where({
          _openid: openid
        }).get()
      })
      // 更新该记录
      .then(res => {
        return db.collection("profile").doc(res.data[0]._id).update({
          data: {
            bgImgUrl: bgImgUrl
          }
        })
      })
      // 删除原图片，并结束任务
      .then(res => {
        if (curBgImgUrl !== defaultImgUrl) {
          wx.cloud.deleteFile({
            fileList: [curBgImgUrl]
          })
        }
        wx.hideLoading();
        console.log("更新自定义背景图成功：", res);
        toast("上传自定义背景成功");

        // 更新本地存储的userInfo
        let tmpUserInfo = wx.getStorageSync("userInfo");
        tmpUserInfo.bgImgUrl = bgImgUrl;
        wx.setStorageSync("userInfo", tmpUserInfo);

        // 更新当前页面中的头像图片地址
        that.setData({
          bgImgUrl: bgImgUrl
        })
      })
      // 捕获错误
      .catch(err => {
        wx.hideLoading();
        console.log("更新自定义头像失败：", err);
        toast("上传失败", "none");
      });
    }
  })
}

module.exports = {
  check: checkImg,
  default: defaultImg,
  upload: uploadImg
}