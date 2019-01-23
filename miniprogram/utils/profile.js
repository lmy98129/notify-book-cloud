// profile.js
const db = wx.cloud.database();
const app = getApp();
const profModel = require("./profile-model");
const toast = require("./message").toast;

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const downloadNew = async (that, callback) => {
  wx.getUserInfo({
    success: async result => {

      let curUserProfile = app.globalData.DEFAULT_PROFILE;
      let msg = "";
      
      try {
        // 获取本地存储的用户自身信息

        curUserProfile.nickName = result.userInfo.nickName;
        if (result.userInfo.avatarUrl === undefined || result.userInfo.avatarUrl === "") {
          curUserProfile.avatarUrl = "/images/user-unlogin.png";
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

        console.log(profileRes);

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
          let isAttrArray = ["isAvatarCustomed", "isNickNameCustomed", "isBgImgCustomed"];
          let attrArray = ["avatarUrl", "nickName", "bgImgUrl"];

          // 遍历用户自定义变量的标志属性
          isAttrArray.forEach((attr, index) => {
            // 判空操作
            if (cloudProfile[attr] === undefined) {
              return;
            }
            // 若该标志属性且为true，则按照云端资料内容
            if (cloudProfile[attr]) {
              curUserProfile[attrArray[index]] = cloudProfile[attrArray[index]];
            // 若该标志属性为false，则按照本地获取的内容，以保证数据出现变动时及时更新数据库  
            } else if (curUserProfile[attrArray[index]] !== cloudProfile[attrArray[index]]) {
              db.collection("profile-new").doc(cloudProfile._id).update({data: {
                [attrArray[index]]: curUserProfile[attrArray[index]]
              }});
            }
          });
          
          // 其余的属性均按照云端的来拷贝
          for (let attr in cloudProfile) {
            if (!attrArray.includes(attr)) {
              curUserProfile[attr] = cloudProfile[attr]
            }
          }

        }

        // 汇总并存储到本地
        wx.setStorage({key: "curUserProfile", data: curUserProfile});
        
        // 根据当前已经得到的信息，判断用户审核状态、身份（是否管理员等信息）
        if (!curUserProfile.isAdmin) {
          switch(curUserProfile.authStatus) {
            case "unauthorized":
              that.setData({
                isRedDot: true,
                isAuthRedDot: true
              })
              break;
            case "auditing":
            case "authorized": 
              break;
          }
        }

        callback(that, curUserProfile);

        if (curUserProfile.isProfileEmpty) {
          msg = "用户资料为空";
        } else {
          msg = "用户资料内容正常";
        }
        console.log("获取用户资料成功：" + msg);
      } catch (e) {
        msg = e.message;
        console.log("获取用户资料出错：" + msg);
        console.log(e);
        toast("获取用户资料出错", "none");
      }
    }
  })

}

const download = () => {
  let msg = {};
  return (db.collection("profile").where({
    _openid: app.globalData.openid
    // wx.getStorageSync("openid")
  })).get()
    .then(res => {
      if (res.data.length === 0) {
        db.collection("profile").add({
          data: {
            nickName: wx.getStorageSync("userInfo").nickName
          }
        })
        msg = {
          code: 0,
          msg: "profile record added & nickName uploaded"
        }
        return Promise.resolve(msg);
      } else if (res.data[0].realName !== undefined) {
        msg = {
          code: 2,
          msg: "profile exist",
          data: res.data[0]
        }
        return Promise.resolve(msg);
      } else {
        msg = {
          code: 1,
          msg: "profile stay empty with only nickName"
        }
        return Promise.resolve(msg);
      }
    })
    .catch(err => {
      msg = {
        code: -1,
        msg: "profile download fail",
        err: err
      }
      return Promise.reject(msg);
    })
}

const upload = (userInfo) => {
  let msg = {};
  return (db.collection("profile").where({
    _openid: wx.getStorageSync("openid")
  }).get()
    .then(res => {
      if (res.data.length === 0) {
        return db.collection("profile").add({
          data: userInfo
        })
          .then(res => {
            msg = {
              code: 1,
              msg: "profile record added"
            };
            return Promise.resolve(msg);
          })
      } else if (res.data[0] !== undefined) {
        return db.collection("profile")
          .doc(res.data[0]._id).update({
            data: userInfo
          }).then(res => {
            msg = {
              code: 2,
              msg: "profile record updated"
            };
            return Promise.resolve(msg);
          })
      }
    }))
    .catch(err => {
      msg = {
        code: -1,
        msg: "profile upload fail",
        err: err
      }
      return Promise.reject(msg);
    })
}

const introUpload = (intro) => {
  let msg = {};
  return (db.collection("profile").where({
    _openid: wx.getStorageSync("openid")
  }).get()
    .then(res => {
      return db.collection("profile")
        .doc(res.data[0]._id).update({
          data: {
            intro: intro
          }
        }).then(res => {
          msg = {
            code: 0,
            msg: "profile intro updated"
          }
          return Promise.resolve(msg);
        })
    })
    .catch(err => {
      msg = {
        code: 0,
        msg: "profile intro updated failed",
        err: err
      }
      return Promise.reject(msg);
    }))
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
      case "enterSchoolTime":
      case "leaveSchoolTime":
        if (tmpUserInfo[item] === undefined || tmpUserInfo[item] === "") {
          tmpUserInfo[item] = "在校";
        } else {
          tmpDate = tmpUserInfo[item].split("-");
          tmpUserInfo[item] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
        }
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
            if (tmpArray[i][subItem] === undefined || tmpArray[i][subItem] === "") {
              tmpArray[i][subItem] = "在职";
            } else if (subItem === "jobStartTime" || subItem === "jobEndTime") {
              tmpDate = tmpArray[i][subItem].split("-");
              tmpArray[i][subItem] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
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

}

module.exports = {
  upload,
  download: downloadNew,
  introUpload,
  decode,
}