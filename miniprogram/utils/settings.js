const db = wx.cloud.database();
const toast = require('./message').toast;
const defaultPermission = require('./profile-model').permission;
const STATUS = require('./profile-model').PERMISSION_STATUS;
const defaultPermissionSetting = require('./profile-model').permissionSetting;
const profile = require('./profile');

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const settingToPermission = async (setting, otherUserProfile) => {
  let curUserProfile = await profile.check();
  let isSameClass = false;
  outer:
  for (let otherDegree of otherUserProfile.degreeArray) {
    for (let curDegree of curUserProfile.degreeArray) {
      if (curDegree.className === otherDegree.className) {
        isSameClass = true;
        break outer;
      }
    }
  }
  let permission = { isShowUserInfo: {} };
  for (let key in setting) {
    if (key.indexOf("Array") >= 0) {
      let newKey = key.replace(key[0], key[0].toUpperCase());
      switch(setting[key]) {
        case STATUS.ALL:
          permission[`isShow${newKey}`] = true;
          break;
        case STATUS.SAME_CLASS:
          if (isSameClass) {
            permission[`isShow${newKey}`] = true;
          } else {
            permission[`isShow${newKey}`] = false;
          }
          break;
        case STATUS.ALL_NOT:
          permission[`isShow${newKey}`] = false;
      }
    } else {
      switch(setting[key]) {
        case STATUS.ALL:
          permission.isShowUserInfo[key] = true;
          break;
        case STATUS.SAME_CLASS:
          if (isSameClass) {
            permission.isShowUserInfo[key] = true;            
          }
          break;
      }
    }
  }
  return permission;
}

const download = async (otherUserProfile) => {
  try {
    let { _openid } = otherUserProfile;
    if (_openid === undefined) {
      return defaultPermission;
    }
    let settingRes = await db.collection("settings").where({ _openid }).get();
    if (settingRes.data) {
      if (settingRes.data.length <= 0) {
        return defaultPermission;
      } else {
        let data = settingRes.data[0];
        delete data._id;
        delete data._openid;
        return settingToPermission(data, otherUserProfile) || defaultPermission;
      }
    } else {
      throw new Error('获取用户设置出错');
    }
  } catch (error) {
    console.log(error);
    toast('获取设置出错');
  }
}

const downloadSetting = async (_openid) => {
  try {
    let settingRes = await db.collection("settings").where({ _openid }).get();
    if (settingRes.data) {
      if (settingRes.data.length <= 0) {
        return defaultPermissionSetting;
      } else {
        let data = settingRes.data[0];
        delete data._id;
        delete data._openid;
        return data || defaultPermissionSetting;
      }
    } throw new Error('获取用户设置出错');
  } catch (error) {
    console.log(error);
    toast('获取设置出错');
  }
}

const add = async (_openid, settings) => {
  try {
    let uploadRes = await db.collection("settings").add({ data: {...settings} });
    let { _id } = uploadRes;
    if (_id !== undefined) {
      // console.log("上传设置成功");
    } else throw new Error('上传用户设置出错');
  } catch (error) {
    console.log(error);
    toast("上传用户设置出错");
  }
}

const upload = async (_openid, settings) => {
  try {
    let settingRes = await db.collection("settings").where({ _openid }).get();
    if (settingRes.data) {
      if (settingRes.data.length <= 0) {
        add(_openid, settings);
      } else {
        let { _id } = settingRes.data[0];
        update(_id, settings);
      }
    } else throw new Error('上传用户设置出错')
  } catch (error) {
    console.log(error);
    toast("上传用户设置出错");
  }
}

const update = async(_id, settings) => {
  try {
    let uploadRes = await db.collection("settings").doc(_id).update({ data: {...settings} });
    let { stats: { updated } } = uploadRes;
    if (updated !== undefined && updated > 0) {
      // toast('上传设置成功');
    } else throw new Error('上传用户设置出错');
  } catch (error) {
    console.log(error);
    toast("上传用户设置出错");
  }
}

module.exports = {
  download,
  upload,
  downloadSetting,
}