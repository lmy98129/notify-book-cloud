// avatar.js
const db = wx.cloud.database();
const toast = require("./message").toast;
const profile = require("./profile");
const app = getApp();

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

/**
 * 上传用户自定义头像
 * @param {*} that 
 */
const upload = (that) => {
  let avatarUrl;
  // 选取图片文件
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async function(res) {
      wx.showLoading({
        title: '上传图片中',
      })

      let curUserProfile = await profile.check();

      const curAvatarUrl = curUserProfile.avatarUrl;
      // 上传图片文件到云存储
      const filePath = res.tempFilePaths[0];
      const openid = app.globalData.openid;
      const cloudPath = 'avatar/avatar-' + openid + (new Date()).getTime() + filePath.match(/\.[^.]+?$/)[0];
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: async res => {
          console.log('上传自定义头像成功：', res)
          avatarUrl = res.fileID;

          try {
            let updateRes = await db.collection("profile-new").doc(curUserProfile._id).update({
                data: {
                  avatarUrl,
                  isAvatarCustomed: true
                }
              })
            wx.cloud.deleteFile({
              fileList: [curAvatarUrl]
            })

            wx.hideLoading();
            console.log("更新自定义头像成功：", updateRes);
            toast("上传图片成功");

            curUserProfile.avatarUrl = avatarUrl;
            wx.setStorage({ key: "curUserProfile", data: curUserProfile });

            // 更新当前页面中的头像图片地址
            that.setData({
              avatarUrl: avatarUrl
            })
            
          } catch (error) {
            wx.hideLoading();
            console.log('更新自定义头像失败：', error.message);
            toast("上传失败", "none");
          }

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
const wechat = (that) => {
  wx.getUserInfo({
    success: async function(res) {
      let wechatAvatarUrl = res.userInfo.avatarUrl;
      if (wechatAvatarUrl === "" || wechatAvatarUrl === undefined) {
        wechatAvatarUrl = app.globalData.DEFAULT_AVATARURL;
      }
      let curUserProfile = await profile.check();
      let curAvatarUrl = curUserProfile.avatarUrl;
      // 比对头像内容
      if (wechatAvatarUrl === curAvatarUrl) {
        toast("当前正在使用微信头像", "none");
        return;
      } else {
        // 需要更新数据库，查询记录的_id
        wx.showLoading({
          title: '更新头像中',
        })

        try {

          await db.collection("profile-new").doc(curUserProfile._id).update({
            data: {
              avatarUrl: wechatAvatarUrl,
              isAvatarCustomed: false
            }
          });

          let deleteRes = await wx.cloud.deleteFile({
            fileList: [curAvatarUrl]
          })

          wx.hideLoading();
          console.log("更新头像成功：", deleteRes);
          toast("更新头像成功");
  
          curUserProfile.avatarUrl = wechatAvatarUrl;
          wx.setStorage({ key: "curUserProfile", data: curUserProfile});
  
          // 更新当前页面中的头像图片地址
          that.setData({
            avatarUrl: wechatAvatarUrl
          })

        } catch (error) {
          wx.hideLoading();
          console.log('更新头像失败：', error.message)
          toast("更新头像失败", "none");
        }

      }
    }
  })
}

const uploadForManage = async (that, mode, index) => {
  let avatarUrl;
  // 选取图片文件
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async function(res) {
      wx.showLoading({
        title: '上传图片中',
      })
      let profiles = wx.getStorageSync(mode);

      const curAvatarUrl = profiles[index].avatarUrl;
      let { _id, _openid } = profiles[index];
      // 上传图片文件到云存储
      const filePath = res.tempFilePaths[0];
      const cloudPath = 'avatar/avatar-' + _openid + (new Date()).getTime() + filePath.match(/\.[^.]+?$/)[0];
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: async res => {
          console.log('上传自定义头像成功：', res)
          avatarUrl = res.fileID;
          try {
            let updateRes = await wx.cloud.callFunction({
              name: "profile-manage",
              data: {
                $url: "uploadAvatar",
                avatarUrl,
                _id,
                collection: "profile-new",
                isAvatarCustomed: true,
              }
            });

            if (curAvatarUrl !== undefined) {
              wx.cloud.deleteFile({
                fileList: [curAvatarUrl]
              })
            }

            wx.hideLoading();
            console.log("更新自定义头像成功：", updateRes);
            toast("上传图片成功");

            profiles[index].avatarUrl = avatarUrl;
            profiles[index].isAvatarCustomed = true;

            wx.setStorage({ key: mode, data: profiles });

            // 更新当前页面中的头像图片地址
            that.setData({
              avatarUrl
            })
            
          } catch (error) {
            wx.hideLoading();
            console.log('更新自定义头像失败：', error.message);
            toast("上传失败", "none");
          }

        }
      })

    }
  })
}

const defaultForManage = async (that, mode, index) => {
  let profiles = wx.getStorageSync(mode);
  let { _id, avatarUrl } = profiles[index];

  if (avatarUrl === undefined || avatarUrl === "" || avatarUrl === app.globalData.DEFAULT_AVATARURL) {
    toast("当前正在使用默认头像", "none");
    return;
  } else {
    let defaultAvatarUrl = app.globalData.DEFAULT_AVATARURL;
    // 需要更新数据库，查询记录的_id
    wx.showLoading({
      title: '更新头像中',
    })

    try {
      await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "uploadAvatar",
          avatarUrl: defaultAvatarUrl,
          _id,
          collection: "profile-new",
          isAvatarCustomed: false,
        }
      });

      let deleteRes = await wx.cloud.deleteFile({
        fileList: [avatarUrl]
      });

      wx.hideLoading();
      console.log("更新头像成功：", deleteRes);
      toast("上传图片成功");

      profiles[index].avatarUrl = defaultAvatarUrl;
      profiles[index].isAvatarCustomed = false;

      wx.setStorage({ key: mode, data: profiles });

      // 更新当前页面中的头像图片地址
      that.setData({
        avatarUrl: defaultAvatarUrl
      })
      
    } catch (error) {
      wx.hideLoading();
      console.log('更新头像失败：', error.message);
      toast("上传失败", "none");
    }
  }

}

module.exports = {
  upload,
  wechat,
  uploadForManage,
  defaultForManage,
}