// avatar.js
const db = wx.cloud.database();
const toast = require("./message").toast;

/**
 * 维护用户头像记录状态为最新
 * @param {*} that 
 * @param {string} avatarUrl 
 */
const checkAvatar = (avatarUrl) => {
  let msg = {};

  // let oldTimeStamp = wx.getStorageSync("shortTimer"),
  //   curTimeStamp = (new Date()).getTime();

  // // 拉长查询周期，减少API调用次数
  // if (!oldTimeStamp) {
  //   // 首次查询
  //   wx.setStorageSync("shortTimer", curTimeStamp);
  // } else if (curTimeStamp - oldTimeStamp < 900000) {
  //   // 查询时间未到
  //   msg = {
  //     code: 0,
  //     msg: "not checking time"
  //   }
  //   return Promise.resolve(msg);
  // } else {
  //   // 更新时间，并执行下方的查询
  //   wx.setStorageSync("shortTimer", curTimeStamp);
  // }

  // 查询用户的openid 
  return (wx.cloud.callFunction({
    name: "login",
    data: {}
  })
  // 存储openid，使用openid查询是否存在该用户的头像记录
  .then(res => {
    let openid = res.result.openid;
    wx.setStorageSync("openid", openid);

    return db.collection("avatar").where({
      _openid: openid
    }).get()

  })
  // 根据查询结果判断是否需要添加或更新头像记录
  .then(res => {

    if (res.data.length === 0) {
      
      // 首次登录，需要添加头像记录
      return db.collection("avatar").add({
        data: {
          avatarUrl: avatarUrl,
          isCustom: false,
        }
      })
      .then(res => {
        // 无需更改本地存储的userInfo中的avatarUrl值
        msg = {
          code: 1,
          msg: "wechat avatar record added"
        };
        return Promise.resolve(msg);
      })

    } else if (!res.data[0].isCustom && res.data[0].avatarUrl !== avatarUrl) {

      // 头像采用微信头像，且需要更新头像记录
      return db.collection("avatar").doc(res.data[0]._id).update({
        data: {
          avatarUrl: avatarUrl
        }
      })
      .then(res => {
        // 无需更改本地存储的userInfo中的avatarUrl值
        msg = {
          code: 2,
          msg: "wechat avatar record updated"
        };
        return Promise.resolve(msg);
      })

    } else if(res.data[0].isCustom) {

      // 头像采用用户自定义头像, 更新本地存储的userInfo
      let tmpUserInfo = wx.getStorageSync("userInfo");
      tmpUserInfo.avatarUrl = res.data[0].avatarUrl;
      wx.setStorageSync("userInfo", tmpUserInfo);

      msg = {
        code: 3,
        msg: "custom avatar downloaded"
      }

      return Promise.resolve(msg);

    } else {
      // 微信头像记录为最新，无需操作
      msg = {
        code: 4,
        msg: "wechat avatar record is latest"
      };
      return Promise.resolve(msg);

    }
  })
  .catch(err => {

    msg = {
      code: -1,
      msg: "avatar check fail",
      err: err
    }
    return Promise.reject(msg);
    
  }))
}

/**
 * 上传用户自定义头像
 * @param {*} that 
 */
const uploadAvatar = (that) => {
  let avatarUrl;
  // 选取图片文件
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: function(res) {
      wx.showLoading({
        title: '上传图片中',
      })

      const curAvatarUrl = wx.getStorageSync("userInfo").avatarUrl;
      // 上传图片文件到云存储
      const filePath = res.tempFilePaths[0];
      const openid = wx.getStorageSync("openid");
      const cloudPath = 'avatar-' + openid + (new Date()).getTime() + filePath.match(/\.[^.]+?$/)[0];
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: res => {
          console.log('上传自定义头像成功：', res)
          avatarUrl = res.fileID;

          // 更新avatar数据库记录
          // 查询记录的_id
          db.collection("avatar").where({
            _openid: openid
          }).get()
          // 更新该记录
          .then(res => {
            return db.collection("avatar").doc(res.data[0]._id).update({
              data: {
                avatarUrl: avatarUrl,
                isCustom: true
              }
            })
          })
          // 删除原图片，并结束任务
          .then(res => {
            wx.cloud.deleteFile({
              fileList: [curAvatarUrl]
            })
            wx.hideLoading();
            console.log("更新自定义头像成功：", res);
            toast("上传图片成功");

            // 更新本地存储的userInfo
            let tmpUserInfo = wx.getStorageSync("userInfo");
            tmpUserInfo.avatarUrl = avatarUrl;
            wx.setStorageSync("userInfo", tmpUserInfo);

            // 更新当前页面中的头像图片地址
            that.setData({
              avatarUrl: avatarUrl
            })

          })
          // 捕获错误
          .catch(err => {
            wx.hideLoading();
            console.log('更新自定义头像失败：', err)
            toast("上传失败", "none");
          });
        },
        fail: err => {
          wx.hideLoading();
          console.log('上传自定义头像失败：', err)
          toast("上传失败", "none");
        }
      });
    }
  })
}

/**
 * 使用微信头像
 * @param {*} that 
 */
const wechatAvatar = (that) => {
  wx.getUserInfo({
    success: function(res) {
      let wechatAvatarUrl = res.userInfo.avatarUrl;
      let curAvatarUrl = wx.getStorageSync("userInfo").avatarUrl;
      // 比对头像内容
      if (wechatAvatarUrl === curAvatarUrl) {
        toast("当前正在使用微信头像", "none");
        return;
      } else {
        // 需要更新数据库，查询记录的_id
        wx.showLoading({
          title: '更新头像中',
        })
        let openid = wx.getStorageSync("openid");
        db.collection("avatar").where({
          _openid: openid
        }).get()
        // 更新该记录
        .then(res => {
          return db.collection("avatar").doc(res.data[0]._id).update({
            data: {
              avatarUrl: wechatAvatarUrl,
              isCustom: false
            }
          })
        })
        // 删除原文件
        .then(res => {
          return wx.cloud.deleteFile({
            fileList: [curAvatarUrl]
          })
        })
        // 结束任务
        .then(res => {
          wx.hideLoading();
          console.log("更新头像成功：", res);
          toast("更新头像成功");

          // 更新本地存储的userInfo
          let tmpUserInfo = wx.getStorageSync("userInfo");
          tmpUserInfo.avatarUrl = wechatAvatarUrl;
          wx.setStorageSync("userInfo", tmpUserInfo);

          // 更新当前页面中的头像图片地址
          that.setData({
            avatarUrl: wechatAvatarUrl
          })
        })
        // 捕获错误
        .catch(err => {
          wx.hideLoading();
          console.log('更新头像失败：', err)
          toast("更新头像失败", "none");
        })
      }
    }
  })
}

module.exports = {
  check: checkAvatar,
  upload: uploadAvatar,
  wechat: wechatAvatar,
}