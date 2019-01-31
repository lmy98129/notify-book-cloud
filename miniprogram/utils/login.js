const avatar = require("./avatar");
const profile = require("./profile");
const bgImg = require("./bg-img");
const auth = require("./auth");
const admin = require("./admin");
const notify = require("./notification");
const rec = require("./recommend");
const toast = require("./message").toast;
const db = wx.cloud.database();

const app = getApp();

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const possibleKnow = async (that) => {
  try {
    let possibleKnowList = await rec.possibleKnow();
    wx.setStorage({key: "possibleKnowList", data: possibleKnowList});
    let realLength = possibleKnowList.length;
    if (realLength <= 9) {
      for (var i=realLength; i<9; i++) {
        possibleKnowList[i] = {avatarUrl: "/images/user-unlogin.png"};
      }
    }
    that.setData({
      possibleKnowList,
      possibleKnowListLength: realLength
    })
  } catch (error) {
    console.log(error.message);
  }
};

const getUserInfo = async (that) => {
  // 若强制刷新标志为false
  if (!app.globalData.forcedRefresh) {
    return;
  }

  // 获取用户信息
  await wx.getSetting({
    success: async result => {
      // 判断是否存在用户信息，若无先跳转到授权页面
      if (!result.authSetting['scope.userInfo']) {
        wx.navigateTo({
          url: '../login/login',
        });
        return;
      }

      await profile.download(that, async (that, curUserProfile) => {
        // 根据当前已经得到的信息，判断用户审核状态、身份（是否管理员等信息）
        if (!curUserProfile.isAdmin) {
          switch(curUserProfile.authStatus) {
            case "unauthorized":
              that.setData({
                isAuthRedDot: true
              })
              break;
            case "auditing":
            case "authorized": 
              that.setData({
                isAuthRedDot: false
              })
              break;
          }
        }

        if (curUserProfile.isAdmin) {
          if (curUserProfile.authStatus !== "authorized") {
            curUserProfile.authStatus = "authorized";
            db.collection("profile-new").doc(curUserProfile._id).update({
              data: {
                authStatus: "authorized"
              }
            });
          }
          wx.setStorage({ key: "curUserProfile", data: curUserProfile });
          console.log("获取用户权限成功：用户为管理员");
        } else {
          console.log("获取用户权限成功：用户为普通用户");
        }

        const sameYearRecList = async () => {
          try {
            let sameYearRecList = await rec.same("degreeStartTime");
            wx.setStorageSync("sameYearRecList", sameYearRecList); 
            that.setData({
              sameYearRecList
            })
            let realLength = sameYearRecList.length;
            if (realLength < 3) {
              let sameYearFixList = [];
              for (let i=0; i<3-realLength; i++) {
                sameYearFixList.push("1");
              }
              that.setData({
                sameYearFixList
              })
            }
          } catch (error) {
            console.log(error.message);
          }
        };

        const sameMajorRecList = async () => {
          try {
            let sameMajorRecList = await rec.same("major");
            wx.setStorageSync("sameMajorRecList", sameMajorRecList); 
            that.setData({
              sameMajorRecList
            })
            let realLength = sameMajorRecList.length;
            if (realLength < 3) {
              let sameMajorFixList = [];
              for (let i=0; i<3-realLength; i++) {
                sameMajorFixList.push("1");
              }
              that.setData({
                sameMajorFixList
              })
            }
          } catch (error) {
            console.log(error.message);
          }
        };


        Promise.all([possibleKnow(that), sameYearRecList(), sameMajorRecList()]);

        let code = await notify.checkDownload();
        if (code == 2) {
         that.setData({
           isNotifyRedDot: true,
         });
        } else {
          that.setData({
            isNotifyRedDot: false,
          })
        }

        let { avatarUrl, nickName, 
          bgImgUrl, isProfileEmpty } = curUserProfile;

        that.setData({
          avatarUrl,
          nickName,
          bgImgUrl,
          isProfileEmpty
        });

        if (that.data.isAuthRedDot || that.data.isNotifyRedDot) {
          that.setData({
            isRedDot: true
          })
        } else {
          that.setData({
            isRedDot: false
          })
        }

      });
      
      
    },
    fail: err => {
      console.log("获取用户设置出错" + err.message);
      toast("获取用户设置出错，请重启小程序", 'none');
    }
  })


}

module.exports = {
  getUserInfo,
  possibleKnow,
}