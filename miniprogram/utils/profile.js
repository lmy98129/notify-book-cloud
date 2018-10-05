// profile.js
const db = wx.cloud.database();
const app = getApp();
const profModel = require("./profile-model");

const download = () => {
  let msg = {};
  return (db.collection("profile").where({
    _openid: wx.getStorageSync("openid")
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
        if (tmpUserInfo[item] === 1) {
          tmpUserInfo[item] = "男";
        } else if (tmpUserInfo[item] === 2) {
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
  download,
  introUpload,
  decode,
}