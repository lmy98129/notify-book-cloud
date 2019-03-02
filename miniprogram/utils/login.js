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

const possibleKnow = async (that, start, pageLength) => {
  try {
    let { recList, total } = await rec.possibleKnow(start, pageLength);
    let possibleKnowList = recList;
    wx.setStorage({key: "possibleKnowList", data: possibleKnowList});
    let realLength = possibleKnowList.length;
    if (realLength <= 9) {
      for (var i=realLength; i<9; i++) {
        possibleKnowList[i] = {avatarUrl: app.globalData.DEFAULT_AVATARURL};
      }
    }
    that.setData({
      possibleKnowList,
      possibleKnowListTotal: total,
      possibleKnowListStart: start,
    })
  } catch (error) {
    console.log(error.message);
  }
};

const sameRecList = async (that, key, name, start, pageLength) => {
  try {
    let { recList, total } = await rec.same(key, start, pageLength);
    let fixList = [];
    wx.setStorageSync("same" + name + "RecList", recList); 

    let realLength = recList.length;
    if (realLength < 3) {
      for (let i=0; i<3-realLength; i++) {
        fixList.push("1");
      }
    }
    that.setData({
      ["same" + name + "RecList"]: recList,
      ["same" + name + "FixList"]: fixList,
      ["same" + name + "Total"]: total,
      ["same" + name + "realLength"]: realLength,
      ["same" + name + "SwiperCurrent"]: 0,
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
            db.collection("profile").doc(curUserProfile._id).update({
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

        Promise.all([possibleKnow(that, 0, 9), sameRecList(that, "degreeStartTime", "Year", 0, 10), sameRecList(that, "major", "Major", 0, 10)]);

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

        if (that.data.isAuthRedDot 
          // || that.data.isNotifyRedDot
          ) {
          that.setData({
            isRedDot: true
          })
        } else {
          that.setData({
            isRedDot: false
          })
        }

        if (that.data.isAuthRedDot || that.data.isNotifyRedDot) {
          wx.showTabBarRedDot({
            index: 0
          });
        } else {
          wx.hideTabBarRedDot({
            index: 0
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
  sameRecList,
}