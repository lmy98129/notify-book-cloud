// profile.js
const db = wx.cloud.database();
const app = getApp();
const profModel = require("./profile-model");
const toast = require("./message").toast;

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
  let getRes = await db.collection("profile-new").where({
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

      if (app.globalData.isIndexPageFirstLoad === undefined) {
        app.globalData.isIndexPageFirstLoad = true;
      }

      if (app.globalData.isIndexPageFirstLoad) {
        wx.showLoading({
          title: "加载中"
        });
      }

      let curUserProfile = wx.getStorageSync("curUserProfile");
      if (curUserProfile === undefined || curUserProfile === "") {
        curUserProfile = app.globalData.DEFAULT_PROFILE;
      }

      let msg = "";
      
      try {
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
        let profileRes = await db.collection("profile-new").where({
          _openid: app.globalData.openid
        }).get();

        // 首次登录
        if (profileRes.data === undefined || profileRes.data.length === 0) {
          curUserProfile.isProfileEmpty = true;
          let data = curUserProfile;

          // 自动添加认证相关的记录以及当前获取到的信息
          db.collection("profile-new").add({ data })
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
              let updateRes = await db.collection("profile-new").doc(cloudProfile._id).update({data: {
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
        if (callback !== undefined) {
          await callback(that, curUserProfile);
        }
        
        if (app.globalData.isIndexPageFirstLoad) {
          wx.hideLoading();
          app.globalData.isIndexPageFirstLoad = false;
        }

        console.log("获取用户资料成功：" + msg);
      } catch (e) {
        msg = e.message;
        console.log("获取用户资料出错：" + msg);
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
        collection: "profile-test",
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

    let updateRes = await db.collection("profile-new").doc(curUserProfile._id).update({
      data: userInfo
    });

    for (let subItem in userInfo) {
      curUserProfile[subItem] = userInfo[subItem];
    }

    wx.setStorage({ key: "curUserProfile", data: curUserProfile });

    wx.hideLoading();
    toast("资料上传成功", "success");
    console.log("更新用户资料成功：" + updateRes.errMsg);
  } catch (error) {
    wx.hideLoading();
    console.log("更新用户资料出错：" + error.message);
    toast("更新资料出错", "none");
  }
}

const introUpload = async (that, intro) => {
  try {
    wx.showLoading({
      title: "资料上传中"
    });
    let curUserProfile = await checkCloud();
    let updateRes = await db.collection("profile-new").doc(curUserProfile._id).update({
      data: { intro }
    });
    curUserProfile.intro = intro;
    wx.setStorage({ key: "curUserProfile", data: curUserProfile });

    wx.hideLoading();
    console.log("更新用户资料成功：" + updateRes.errMsg);

    that.setData({
      introStatus: "default",
      intro
    })
  } catch (error) {
    wx.hideLoading();
    console.log("更新用户资料出错：" + error.message);
    toast("更新资料出错", "none");
  }
}

const decodeForEdit = (tmpUserInfo, initValue, that) => {
  let tmpArray, tmpDate;
  delete tmpUserInfo._id;
  delete tmpUserInfo._openid;
  that.setData({
    avatarUrl: tmpUserInfo.avatarUrl
  })
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
        for(let i=0; i<tmpArray.length; i++) {
          for (let subItem in tmpArray[i]) {
            if (tmpArray[i][subItem] === undefined || tmpArray[i][subItem] === "") {
              tmpArray[i][subItem] = initValue[subItem].default;
              that.setData({
                [item]: tmpArray
              });
            } else if (subItem === "jobStartTime" || subItem === "jobEndTime") {
              tmpDate = tmpArray[i][subItem].split("-");
              tmpArray[i][subItem] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
              that.setData({
                [item]: tmpArray
              });
            }
          }
        }
        break;
      case "contactArray":
        tmpArray = JSON.parse(JSON.stringify(tmpUserInfo[item]));
        that.setData({
          [item]: tmpArray
        })
        break;
      case "degreeArray":
        tmpArray = JSON.parse(JSON.stringify(tmpUserInfo[item]));
        for(let i=0; i<tmpArray.length; i++) {
          for (let subItem in tmpArray[i]) {
            if (tmpArray[i][subItem] === undefined || tmpArray[i][subItem] === "") {
              tmpArray[i][subItem] = initValue[subItem].default;
              that.setData({
                [item]: tmpArray
              });
            } else if (subItem === "degreeStartTime" || subItem === "degreeEndTime") {
              tmpDate = tmpArray[i][subItem].split("-");
              tmpArray[i][subItem] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
              that.setData({
                [item]: tmpArray
              });
            }
          }
        }
        break;
      default:
        that.setData({
          [item]: tmpUserInfo[item]
        });
        break;
    }
  }

  return tmpUserInfo;
}

const decode = (tmpUserInfo, that) => {
  let tmpDate, tmpArray, newTmpArray, tmpObj;
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
        that.setData({
          [item]: newTmpArray
        });
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
        that.setData({
          [item]: newTmpArray
        })
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
        that.setData({
          [item]: newTmpArray
        });
        delete tmpUserInfo[item];
        break;
      case "intro":
        that.setData({
          intro: tmpUserInfo[item],
          tmpIntro: tmpUserInfo[item]
        });
        delete tmpUserInfo[item];
        break;
    }
  }

  tmpArray = [];
  for (let subItem in profModel.userInfo) {
    for (let item in tmpUserInfo) {
      if (subItem === item) 
        tmpArray.push({
          title: profModel.initValue[item].name,
          content: tmpUserInfo[item]
        });
    }
  }

  that.setData({
    userInfo: tmpArray,
    profileStatus: 1
  });

  return tmpUserInfo;

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
        collection: "profile-test",
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
    console.log("更新用户资料成功：" + updateRes);
  } catch (error) {
    wx.hideLoading();
    console.log("更新用户资料出错：" + error.message);
    toast("更新资料出错", "none");
  }
}

module.exports = {
  upload,
  uploadForManage,
  download,
  introUpload,
  introUploadForManage,
  decode,
  decodeForEdit,
  check: checkLocal,
}