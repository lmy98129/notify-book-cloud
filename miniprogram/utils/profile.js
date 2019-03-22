// profile.js
const db = wx.cloud.database();
const app = getApp();
const profModel = require("./profile-model");
const toast = require("./message").toast;
const confirmOnly = require("./message").confirmOnly;

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const checkLocal = async () => {
  let curUserProfile = wx.getStorageSync("curUserProfile");
  if (curUserProfile === undefined || curUserProfile === "") {
    await download();
    curUserProfile = wx.getStorageSync("curUserProfile");
  }
  return curUserProfile;
}

const checkCloud = async () => {
  let getRes = await db.collection("profile").where({
    _openid: app.globalData.openid
  }).get();
  if (getRes.data.length === 0) {
    await download();
  }
  return await checkLocal();
}

const download = async (that, callback) => {
  await wx.getUserInfo({
    success: async result => {
      try {
        // if (app.globalData.isProfilePageFirstLoad === undefined) {
        //   app.globalData.isProfilePageFirstLoad = true;
        // }
        // if (app.globalData.isProfilePageFirstLoad) {
        //   wx.showLoading({ title: "加载中" });
        // }

        let curUserProfile = wx.getStorageSync("curUserProfile");
        if (curUserProfile === undefined || curUserProfile === "") {
          curUserProfile = app.globalData.DEFAULT_PROFILE;
        }
  
        let msg = "";
        // 获取本地存储的用户自身信息

        curUserProfile.nickName = result.userInfo.nickName;
        curUserProfile.gender = result.userInfo.gender;
        if (result.userInfo.avatarUrl === undefined || result.userInfo.avatarUrl === "") {
          curUserProfile.avatarUrl = app.globalData.DEFAULT_AVATARURL;
        } else {
          curUserProfile.avatarUrl = result.userInfo.avatarUrl;
        }
  
        // 利用云函数完成openid获取工作
        let loginRes = await wx.cloud.callFunction({
          name: "login",
          data: {}
        });
        app.globalData.openid = loginRes.result.openid;
        wx.setStorage({ key: "openid", data: loginRes.result.openid });
        
        // 查询用户资料信息
        let profileRes = await db.collection("profile").where({
          _openid: app.globalData.openid
        }).get();

        // 首次登录
        if (profileRes.data === undefined || profileRes.data.length === 0) {
          curUserProfile.isProfileEmpty = true;
          let data = curUserProfile;

          // 自动添加认证相关的记录以及当前获取到的信息
          db.collection("profile").add({ data })
          msg = "首次登陆，自动添加认证相关记录";

        // 云端存在用户资料，取第一个
        } else {
          curUserProfile.isProfileEmpty = false;
          let cloudProfile = profileRes.data[0];

          // 用户自定义变量的遍历数组
          let isAttrArray = ["isAvatarCustomed", "isNickNameCustomed"];
          let attrArray = ["avatarUrl", "nickName"];
          // 此处不应加入bgimg的标志属性以及对应属性，因为事实上它的更新逻辑和普通的属性是一样的
          // 这两个之所以需要特殊维护是因为：在其他用户的界面中展示时，应当展示存储在数据库中且是最新的用户名和用户头像

          // 遍历用户自定义变量的标志属性
          isAttrArray.forEach(async (attr, index) => {
            // 判空操作
            if (cloudProfile[attr] === undefined) {
              return;
            }
            // 若该标志属性且为true，则按照云端资料内容
            if (cloudProfile[attr]) {
              curUserProfile[attrArray[index]] = cloudProfile[attrArray[index]];
            // 若该标志属性为false，且云端资料与本地的不同，则按照本地获取的内容，以保证数据出现变动时及时更新数据库  
            } else if (curUserProfile[attrArray[index]] !== cloudProfile[attrArray[index]]) {
              let updateRes = await db.collection("profile").doc(cloudProfile._id).update({data: {
                [attrArray[index]]: curUserProfile[attrArray[index]]
              }});
              console.log("更新用户资料成功："+ attr +" "+ updateRes);
            }
          });

          // 其余的属性均按照云端的来拷贝
          for (let attr in cloudProfile) {
            if (!attrArray.includes(attr)) {
              curUserProfile[attr] = cloudProfile[attr]
            }
          }

          if (curUserProfile.isProfileEmpty) {
            msg = "用户资料为空";
          } else {
            msg = "用户资料内容正常";
          }

        }

        // 汇总并存储到本地
        wx.setStorage({ key: "curUserProfile", data: curUserProfile });

        // 回调函数用于不同功能用途
        if (callback !== undefined && that !== undefined) {
          await callback(that, curUserProfile);
        }

        // if (app.globalData.isProfilePageFirstLoad) {
        //   wx.hideLoading();
        //   app.globalData.isProfilePageFirstLoad = false;
        // }

        console.log("获取用户资料成功：", msg);
      } catch (e) {
        // if (app.globalData.isProfilePageFirstLoad) {
        //   wx.hideLoading();
        //   app.globalData.isProfilePageFirstLoad = false;
        // }
        // msg = e.message;
        console.log(e);
        // console.log("获取用户资料出错：", msg);
        toast("获取用户资料出错", "none");
      }
    }
  })

}

const uploadForManage = async (userInfo, mode, index, that) => {
  try {
    wx.showLoading({
      title: "资料上传中"
    });
    
    userInfo.isProfileEmpty = false;
    
    let profiles = wx.getStorageSync(mode);

    let res = await wx.cloud.callFunction({
      name: "profile-manage",
      data: {
        $url: "uploadProfile",
        profile: userInfo,
        collection: "profile",
        _id: profiles[index]._id
      }
    })
    

    for (let subItem in userInfo) {
      profiles[index][subItem] = userInfo[subItem];
    }

    wx.setStorage({ key: mode, data: profiles });

    wx.hideLoading();
    toast("资料上传成功", "success");
    console.log("更新用户资料成功：", res);
  } catch (error) {
    wx.hideLoading();
    console.log("更新用户资料出错：", error.message);
    toast("更新资料出错", "none");
  }
}

const upload = async (userInfo) => {
  try {
    wx.showLoading({
      title: "资料上传中"
    });
    let curUserProfile = await checkCloud();
  
    userInfo.isProfileEmpty = false;

    let updateRes = await db.collection("profile").doc(curUserProfile._id).update({
      data: userInfo
    });

    for (let subItem in userInfo) {
      curUserProfile[subItem] = userInfo[subItem];
    }

    wx.setStorage({ key: "curUserProfile", data: curUserProfile });

    wx.hideLoading();
    toast("资料上传成功", "success");
    console.log("更新用户资料成功：", updateRes.errMsg);
  } catch (error) {
    wx.hideLoading();
    console.log("更新用户资料出错：", error.message);
    toast("更新资料出错", "none");
  }
}

const introUpload = async (that, intro) => {
  try {
    wx.showLoading({
      title: "资料上传中"
    });
    let curUserProfile = await checkCloud();
    let updateRes = await db.collection("profile").doc(curUserProfile._id).update({
      data: { intro }
    });
    curUserProfile.intro = intro;
    wx.setStorage({ key: "curUserProfile", data: curUserProfile });

    wx.hideLoading();
    console.log("更新用户资料成功：", updateRes.errMsg);

    that.setData({
      introStatus: "default",
      intro
    })
  } catch (error) {
    wx.hideLoading();
    console.log("更新用户资料出错：", error.message);
    toast("更新资料出错", "none");
  }
}

const decodeForEdit = (tmpUserInfo, initValue, initUserInfo, classNameArray, that) => {
  let tmpArray, tmpDate;
  delete tmpUserInfo._id;
  delete tmpUserInfo._openid;
  if (tmpUserInfo.avatarUrl !== undefined) {
    that.setData({
      avatarUrl: tmpUserInfo.avatarUrl
    })
  }
  for (let item in tmpUserInfo) {
    switch(item) {
      case "birthDate": 
        tmpDate = tmpUserInfo[item].split("-");
        that.setData({
          [item]: parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月" + parseInt(tmpDate[2]) + "日"
        });
        break;
      case "jobArray":
        tmpArray = JSON.parse(JSON.stringify(tmpUserInfo[item]));
        for (let key in initUserInfo[item][0]) {
          for (let tmpItem of tmpArray) {
            if (tmpItem[key] === undefined || tmpItem[key] === "") {
              tmpItem[key] = initUserInfo[item][0][key];
            } else if (key === "jobStartTime" || key === "jobEndTime") {
              tmpDate = tmpItem[key].split("-");
              tmpItem[key] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
            }
          }
        }
        that.setData({
          [item]: tmpArray
        });
        break;
      case "contactArray":
        tmpArray = JSON.parse(JSON.stringify(tmpUserInfo[item]));
        that.setData({
          [item]: tmpArray
        })
        break;
      case "degreeArray":
        tmpArray = JSON.parse(JSON.stringify(tmpUserInfo[item]));
        for (let key in initUserInfo[item][0]) {
          for (let tmpItem of tmpArray) {
            if (tmpItem[key] === undefined || tmpItem[key] === "") {
              tmpItem[key] = initUserInfo[item][0][key];
            } else if (key === "degreeStartTime" || key === "degreeEndTime") {
              tmpDate = tmpItem[key].split("-");
              tmpItem[key] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
            } else if (key === "className") {
              if (classNameArray.indexOf(tmpItem[key]) < 0) {
                tmpItem[key + "Extra"] = tmpItem[key];
                tmpItem[key] = "其他班级";
              }
            }
          }
        }
        that.setData({
          [item]: tmpArray
        });
        break;
      default:
        that.setData({
          [item]: tmpUserInfo[item]
        });
        break;
    }
  }

  // 填补可能出现的空缺
  for (let key in initUserInfo) {
    if (tmpUserInfo[key] === undefined || (typeof tmpUserInfo[key] === "string" && tmpUserInfo[key] === "")) {
      tmpUserInfo[key] = initUserInfo[key];
    } else if (tmpUserInfo[key] instanceof Array) {
      for (let subKey in initUserInfo[key][0]) {
        for (let item of tmpUserInfo[key]) {
          if (item[subKey] === undefined || item[subKey] === "") {
            item[subKey] = initUserInfo[key][0][subKey];
          }
        }
      }
    }
  }

  return tmpUserInfo;
}

const decode = (tmpUserInfo) => {
  let tmpDate, tmpArray, newTmpArray, tmpObj, result = {};
  delete tmpUserInfo._openid;
  delete tmpUserInfo._id;
  for (let item in tmpUserInfo) {
    switch (item) {
      case "nickName":
      case "bgImgUrl":
        delete tmpUserInfo[item];
        break;
      case "gender":
        if (tmpUserInfo[item] === 1 || parseInt(tmpUserInfo[item]) === 1) {
          tmpUserInfo[item] = "男";
        } else if (tmpUserInfo[item] === 2 || parseInt(tmpUserInfo[item]) === 2) {
          tmpUserInfo[item] = "女";
        }
        break;
      case "birthDate": 
        tmpDate = tmpUserInfo[item].split("-");
        tmpUserInfo[item] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月" + parseInt(tmpDate[2]) + "日";
        break;
      case "wechatId":
      case "phoneNumber":
      case "eMail":
      case "address":
        if (tmpUserInfo[item] === undefined || tmpUserInfo[item] === "") {
          delete tmpUserInfo[item];
        }
        break;
      case "jobArray":
        newTmpArray = [];
        tmpArray = JSON.parse(JSON.stringify(tmpUserInfo[item]));
        for(let i=0; i<tmpArray.length; i++) {
          tmpObj = {
            institution: {},
            job: {},
            jobStartTime: {},
            jobEndTime: {}
          };
          for (let subItem in tmpArray[i]) {
            switch(subItem) {
              case "jobEndTime":
                if (tmpArray[i][subItem] === undefined || tmpArray[i][subItem] === "") {
                  tmpArray[i][subItem] = "在职";
                } else {
                  tmpDate = tmpArray[i][subItem].split("-");
                  tmpArray[i][subItem] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
                }
                break;
              case "jobStartTime":
                tmpDate = tmpArray[i][subItem].split("-");
                tmpArray[i][subItem] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
                break;
            }
            tmpObj[subItem].title = profModel.initValue[subItem].name;
            tmpObj[subItem].content = tmpArray[i][subItem];
          }
          newTmpArray.push(tmpObj);
        }
        result[item] = newTmpArray;
        delete tmpUserInfo[item];
        break;
      case "contactArray":
        newTmpArray = [];
        tmpArray = JSON.parse(JSON.stringify(tmpUserInfo[item]));
        for (let i=0; i<tmpArray.length; i++) {
          tmpObj = {
            contactType: {},
            content: {}
          }
          for (let subItem in tmpArray[i]) {
            tmpObj[subItem].title = profModel.initValue[subItem].name;
            tmpObj[subItem].content = tmpArray[i][subItem];
          }
          newTmpArray.push(tmpObj);
        }
        result[item] = newTmpArray;
        delete tmpUserInfo[item];
        break;
      case "degreeArray":
        newTmpArray = [];
        tmpArray = JSON.parse(JSON.stringify(tmpUserInfo[item]));
        for (let i=0; i<tmpArray.length; i++) {
          tmpObj = {
            degree: {},
            school: {},
            major: {},
            className: {},
            headteacher: {},
            degreeStartTime: {},
            degreeEndTime: {},
            college: {},
          }
          for (let subItem in tmpArray[i]) {
            switch(subItem) {
              case "degreeEndTime":
                if (tmpArray[i][subItem] === undefined || tmpArray[i][subItem] === "") {
                  tmpArray[i][subItem] = "在读";
                } else {
                  tmpDate = tmpArray[i][subItem].split("-");
                  tmpArray[i][subItem] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
                }
                break;
              case "degreeStartTime":
                tmpDate = tmpArray[i][subItem].split("-");
                tmpArray[i][subItem] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
                break;
            }
            tmpObj[subItem].title = profModel.initValue[subItem].name;
            tmpObj[subItem].content = tmpArray[i][subItem];
          }
          newTmpArray.push(tmpObj);
        }
        result[item] = newTmpArray;
        delete tmpUserInfo[item];
        break;
      case "intro":
        result[item] = tmpUserInfo[item];
        delete tmpUserInfo[item];
        break;
    }
  }

  
  tmpArray = [];
  for (let item in tmpUserInfo) {
    if (profModel.userInfo.hasOwnProperty(item)) {
      tmpArray.push({
        title: profModel.initValue[item].name,
        content: tmpUserInfo[item],
        source: item
      });
    }
  }


  result.userInfo = tmpArray;
  result.profileStatus = "normal";

  return result;

}

const introUploadForManage = async (that, intro, mode, index) => {
  try {
    wx.showLoading({
      title: "资料上传中"
    });
    let profiles = wx.getStorageSync(mode);
    let { _id } = profiles[index];

    let updateRes = await wx.cloud.callFunction({
      name: "profile-manage",
      data: {
        $url: "uploadIntro",
        collection: "profile",
        _id,
        intro
      }
    })

    profiles[index].intro = intro;
    wx.setStorage({ key: mode, data: profiles });

    wx.hideLoading();

    that.setData({
      introStatus: "default",
      intro
    })
    console.log("更新用户资料成功：", updateRes);
  } catch (error) {
    wx.hideLoading();
    console.log("更新用户资料出错：", error.message);
    toast("更新资料出错", "none");
  }
}

const uploadForAddProflieManage = async (profile) => {
  try {
    wx.showLoading({
      title: "资料上传中"
    });

    let res = await wx.cloud.callFunction({
      name: "profile-manage",
      data: {
        $url: "addProfile",
        profile,
        collection: "profile",
      }
    })

    wx.hideLoading();
    confirmOnly("本次添加成功的用户资料在校友资料的最后一页，如需查看，请点击校友资料管理页面右下角“末页”按钮并滚动表格到底部。");
    console.log("更新用户资料成功：", res);
  } catch (error) {
    wx.hideLoading();
    console.log("更新用户资料出错：", error.message);
    toast("更新资料出错", "none");
  }

}

const deleteOldProfile = async (_id) => {
  try {
    let cloudRes = await wx.cloud.callFunction({
      name: "profile-manage",
      data: {
        $url: "deleteProfile",
        collection: "profile",
        _id,
      }
    })
    console.log("删除原资料成功", cloudRes);
  } catch (error) {
    console.log("删除原资料失败", error.message);
  }
}

module.exports = {
  upload,
  uploadForManage,
  uploadForAddProflieManage,
  download,
  introUpload,
  introUploadForManage,
  decode,
  decodeForEdit,
  check: checkLocal,
  deleteOldProfile,
}