const profile = require("./profile");
const notify = require("./notification");
const rec = require("./recommend");
const toast = require("./message").toast;
const db = wx.cloud.database();

const app = getApp();

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const possibleKnow = async (that, start, pageLength, isShowForAuth) => {
  try {
    let customedRequestArray = undefined;
    if (isShowForAuth !== undefined && isShowForAuth == true) {
      customedRequestArray = [{ text: "本科", weight: [{ value: 4, keyArray: ["degree"] }] }];
    }
    let { recList, total } = await rec.possibleKnow(start, pageLength, customedRequestArray);
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
      possibleKnowListTotal: realLength,
      possibleKnowListStart: start,
    })
  } catch (error) {
    console.log(error.message);
  }
};

const sameRecList = async (that, key, name, start, pageLength, isEmpty) => {
  try {
    if (isEmpty !== undefined && isEmpty == true) {
      that.setData({
        ["same" + name + "RecList"]: [],
        ["same" + name + "FixList"]: [1, 1, 1],
        ["same" + name + "Total"]: 0,
        ["same" + name + "realLength"]: 0,
        ["same" + name + "SwiperCurrent"]: 0,
      })
    } else {
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
    }

  } catch (error) {
    console.log(error.message);
  }
};

const getUserInfoForProfile = async (that) => {
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
        let { avatarUrl, nickName, bgImgUrl, isAdmin, authStatus, isProfileEmpty } = curUserProfile;
        if (!isAdmin) {
          switch(authStatus) {
            case "unauthorized":
              wx.showTabBarRedDot({
                index: 1,
              })
              break;
            case "auditing":
            case "authorized": 
              wx.hideTabBarRedDot({
                index: 1,
              })
              break;
          }
        }
        if (avatarUrl !== undefined) {
          that.setData({ avatarUrl });
        }
        if (bgImgUrl !== undefined) {
          that.setData({ bgImgUrl })
        }
        if (nickName !== undefined) {
          that.setData({ nickName })
        }
        if (bgImgUrl === "" || bgImgUrl === undefined) {
          that.setData({
            bgImgUrl: app.globalData.DEFAULT_BGIMGURL
          })
        }
        if (isProfileEmpty) {
          that.setData({
            profileStatus: "empty"
          })
        } else {
          let decodeRes = profile.decode(curUserProfile);
          let { intro, profileStatus, ...profileData } = decodeRes;
          that.setData({
            intro, profileStatus, profileData
          });
        }
      });

    }
  })
}

const getUserInfoForIndex = async (that) => {
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

      try {

        if (app.globalData.isIndexPageFirstLoad === undefined) {
          app.globalData.isIndexPageFirstLoad = true;
        }
  
        if (app.globalData.isIndexPageFirstLoad) {
          wx.showLoading({
            title: "加载中"
          });
        }

        let curUserProfile = await profile.check();
  
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

        let checkShowRes = await db.collection("settings").where({
          isShowForAuth: true
        }).get();
        let isShowForAuth = false;

        if (checkShowRes.data && checkShowRes.data.length > 0) {
          isShowForAuth = true;
        }
  
        if (!curUserProfile.isProfileEmpty) {
          Promise.all([possibleKnow(that, 0, 8), 
            sameRecList(that, "degreeStartTime", "Year", 0, 10), 
            sameRecList(that, "major", "Major", 0, 10)]);
        } else if (curUserProfile.isProfileEmpty && isShowForAuth) {
          Promise.all([possibleKnow(that, 0, 8, true), 
            sameRecList(that, "degreeStartTime", "Year", 0, 10, true), 
            sameRecList(that, "major", "Major", 0, 10, true)
          ])
        }
  
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
          isProfileEmpty,
          isShowForAuth,
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
            index: 1
          });
        } else {
          wx.hideTabBarRedDot({
            index: 1
          })
        }
        
        if (app.globalData.isIndexPageFirstLoad) {
          wx.hideLoading();
          app.globalData.isIndexPageFirstLoad = false;
        }

      } catch (error) {
        if (app.globalData.isIndexPageFirstLoad) {
          wx.hideLoading();
          app.globalData.isIndexPageFirstLoad = false;
        }
        console.log("数据加载失败");
        toast("数据加载失败", "none");
      }

    },
    fail: err => {
      console.log("获取用户设置出错" + err.message);
      toast("获取用户设置出错，请重启小程序", 'none');
    }
  })


}

module.exports = {
  getUserInfoForProfile,
  getUserInfoForIndex,
  possibleKnow,
  sameRecList,
}