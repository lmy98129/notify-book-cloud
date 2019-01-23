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

/**
 * @todo 测试通过后，替换getUserInfo业务
 */
const getUserInfoNew = (that) => {
  // 若强制刷新标志为false
  if (!app.globalData.forcedRefresh) {
    return;
  }

  // 获取用户信息
  wx.getSetting({
    success: async result => {
      // 判断是否存在用户信息，若无先跳转到授权页面
      if (!result.authSetting['scope.userInfo']) {
        wx.navigateTo({
          url: '../login/login',
        });
        return;
      }

      wx.getUserInfo({
        success: async result => {

          let curUserProfile = {
            bgImgUrl: app.globalData.DEFAULT_BGIMGURL,
            authImgUrl: [],
            authRemark: "",
            authStatus: "unauthorized",
            authIsCode: false,
            isAdmin: false,
            isAvatarCustomed: false,
            isNickNameCustomed: false,
            isBgImgCustomed: false
          };
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
    
            // 消息列表、推荐列表（待重构）
            // Promise.all([(async () => {
            //   let code = await notify.checkDownload();
            //   if (code == 1 && wx.getStorageSync("unReadArray").length > 0) {
            //    that.setData({
            //      isNotifyRedDot: true,
            //      isRedDot: true
            //    });
            //  } else {
            //    that.setData({
            //      isNotifyRedDot: false,
            //    })
            //  }
            // })(),
            // (async () => {
            //   let res = await rec.possibleKnow();
            //   wx.setStorageSync("possibleKnowList", res);
            //   let realLength = res.length;
            //   if (res.length <= 9) {
            //       for (var i=res.length; i<9; i++) {
            //         res[i] = {avatarUrl: "/images/user-unlogin.png"}
            //       }
            //   }
            //   that.setData({
            //     possibleKnowList: res,
            //     possibleKnowListLength: realLength
            //   })
            // })(),
            // (async () => {
            //   let res = await rec.same("enterSchoolTime");
            //   wx.setStorageSync("sameYearRecList", res);                
            //   that.setData({
            //     sameYearRecList: res
            //   })
            //   if (res.length < 3) {
            //     let tmpArray = [];
            //     for (let i=0; i<3-res.length; i++) {
            //       tmpArray.push("1");
            //     }
            //     that.setData({
            //       sameYearFixList: tmpArray
            //     })
            //   }
            // })(),
            // (async () => {
            //   let res = await rec.same("major");
            //   wx.setStorageSync("sameMajorRecList", res);                
            //   that.setData({
            //     sameMajorRecList: res
            //   })
            //   if (res.length < 3) {
            //     let tmpArray = [];
            //     for (let i=0; i<3-res.length; i++) {
            //       tmpArray.push("1");
            //     }
            //     that.setData({
            //       sameMajorFixList: tmpArray
            //     })
            //   }
            // })(),]).then().catch(e => {
            //   msg = e.message;
            //   console.log("获取用户资料出错：" + msg);
            //   toast("获取用户资料出错", "none");
            // })
    
            let { avatarUrl, nickName, 
              bgImgUrl, isProfileEmpty } = curUserProfile;
    
            that.setData({
              avatarUrl,
              nickName,
              bgImgUrl,
              isProfileEmpty
            });
    
            if (isProfileEmpty) {
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
      
      
    },
    fail: err => {
      toast("获取用户设置出错，请重启小程序", 'none');
    }
  })


}

const getUserInfo = (that) => {
  // 获取用户信息
  let nickname, avatarUrl, bgImgUrl, tmpUserInfo;
  wx.getSetting({
    success: res => {
      if (!res.authSetting['scope.userInfo']) {
        wx.navigateTo({
          url: '../login/login',
        })
      } else {
        // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
        wx.getUserInfo({
          success: async res => {
            // let loginRes = await wx.cloud.callFunction({
            //   name: "router",
            //   data: {
            //     $url: "login",
            //     detailedUserInfo: res.userInfo
            //   }
            // })

            // console.log(loginRes.result);
            nickname = res.userInfo.nickName;
            avatarUrl = res.userInfo.avatarUrl;
            wx.setStorageSync("userInfo", res.userInfo);
            
            let loginRes = await wx.cloud.callFunction({
              name: "login",
              data: {}
            })
            app.globalData.openid = loginRes.result.openid;
            wx.setStorageSync("openid", loginRes.result.openid);
            
            Promise.all([
              (() => {
                // 头像、昵称检测函数
              avatar.check(avatarUrl)
                .then(res => {
                  console.log("用户头像检测成功：", res.msg);
                  
                  // 使用头像检测函数的最终结果，作为头像的最终路径
                  let tmpUserInfo = wx.getStorageSync("curUserProfile");
                  avatarUrl = tmpUserInfo.avatarUrl;

                  // 对空头像做特殊处理
                  if (avatarUrl === undefined || avatarUrl === "") {
                    avatarUrl = "/images/user-unlogin.png";
                    tmpUserInfo.avatarUrl = "/images/user-unlogin.png";
                    wx.setStorageSync("userInfo", tmpUserInfo);
                  }

                  that.setData({
                    avatarUrl: avatarUrl
                  })
                })
              })(),
              (() => {
                // 开始昵称检测
                profile.download()
                .then(res => {
                  tmpUserInfo = wx.getStorageSync("curUserProfile");
                  if (res.code !== 2) {
                    that.setData({
                      nickname: nickname,
                      profileEmpty: true
                    })
                  } else {

                    // 更新本地存储的userInfo中的昵称
                    nickname = res.data.nickName;
                    tmpUserInfo.nickName = nickname;
                    wx.setStorageSync("userInfo", tmpUserInfo);
                    that.setData({
                      nickname: nickname,
                      profileEmpty: false
                    })
                  }
                  console.log("用户昵称检测成功：", res.msg);
                })
              })(),
              (() => {
                // 开始用户背景图检测
                bgImg.check()
                .then(res => {
                  // 更新本地存储的userInfo中的用户背景图
                  bgImgUrl = res.data;
                  tmpUserInfo = wx.getStorageSync("curUserProfile");
                  tmpUserInfo.bgImgUrl = bgImgUrl
                  wx.setStorageSync("userInfo", tmpUserInfo);
                  that.setData({
                    bgImgUrl: bgImgUrl
                  })
                  console.log("用户背景图检测成功：", res.msg);
                })
              })(),
              (() => {
                // 开始用户权限检测
                admin.check()
                .then(res => {
                  wx.setStorageSync("isAdmin", res.isAdmin);
                  console.log("用户权限检测成功：", res.msg);
  
                  if (!res.isAdmin) {
                    // 开始用户审核检测
                    return auth.check()
                  } else {
                    wx.setStorageSync("authStatus", "authorized");
                    return Promise.resolve({
                      isAdmin: true
                    });
                  }
                })
                .then(res => {
                  if (res.isAdmin !== true) {
                    
                    if (res.status === "unauthorized") {
                      that.setData({
                        isRedDot: true,
                        isAuthRedDot: true
                      });
                    }
                    wx.setStorageSync("authStatus", res.status);
                    console.log("用户审核检测成功：", res.msg);
  
                  }
                })
              })(),
              (async () => {
                let code = await notify.checkDownload();
                if (code == 1 && wx.getStorageSync("unReadArray").length > 0) {
                 that.setData({
                   isNotifyRedDot: true,
                   isRedDot: true
                 });
               } else {
                 that.setData({
                   isNotifyRedDot: false,
                 })
               }
              })(),
              (async () => {
                let res = await rec.possibleKnow();
                wx.setStorageSync("possibleKnowList", res);
                let realLength = res.length;
                if (res.length <= 9) {
                    for (var i=res.length; i<9; i++) {
                      res[i] = {avatarUrl: "/images/user-unlogin.png"}
                    }
                }
                that.setData({
                  possibleKnowList: res,
                  possibleKnowListLength: realLength
                })
              })(),
              (async () => {
                let res = await rec.same("enterSchoolTime");
                wx.setStorageSync("sameYearRecList", res);                
                that.setData({
                  sameYearRecList: res
                })
                if (res.length < 3) {
                  let tmpArray = [];
                  for (let i=0; i<3-res.length; i++) {
                    tmpArray.push("1");
                  }
                  that.setData({
                    sameYearFixList: tmpArray
                  })
                }
              })(),
              (async () => {
                let res = await rec.same("major");
                wx.setStorageSync("sameMajorRecList", res);                
                that.setData({
                  sameMajorRecList: res
                })
                if (res.length < 3) {
                  let tmpArray = [];
                  for (let i=0; i<3-res.length; i++) {
                    tmpArray.push("1");
                  }
                  that.setData({
                    sameMajorFixList: tmpArray
                  })
                }
              })(),
            ]).then()
            .catch(err => {
              console.log("用户信息检测失败： ", err)
            })
          }
        })
      } 
    }
  })
}

const download = () => {
  let nickname, avatarUrl, bgImgUrl, tmpUserInfo;
  // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
  wx.getUserInfo({
    success: async res => {
      nickname = res.userInfo.nickName;
      avatarUrl = res.userInfo.avatarUrl;
      wx.setStorageSync("userInfo", res.userInfo);
      
      let loginRes = await wx.cloud.callFunction({
        name: "login",
        data: {}
      })
      app.globalData.openid = loginRes.result.openid;
      wx.setStorageSync("openid", loginRes.result.openid);
      
      Promise.all([
        (() => {
          // 头像、昵称检测函数
        avatar.check(avatarUrl)
          .then(res => {
            console.log("用户头像检测成功：", res.msg);
            
            // 使用头像检测函数的最终结果，作为头像的最终路径
            let tmpUserInfo = wx.getStorageSync("curUserProfile");
            avatarUrl = tmpUserInfo.avatarUrl;

            // 对空头像做特殊处理
            if (avatarUrl === undefined || avatarUrl === "") {
              avatarUrl = "/images/user-unlogin.png";
              tmpUserInfo.avatarUrl = "/images/user-unlogin.png";
              wx.setStorageSync("userInfo", tmpUserInfo);
            }

          })
        })(),
        (() => {
          // 开始昵称检测
          profile.download()
          .then(res => {
            tmpUserInfo = wx.getStorageSync("curUserProfile");
            if (res.code === 2) {
              // 更新本地存储的userInfo中的昵称
              nickname = res.data.nickName;
              tmpUserInfo.nickName = nickname;
              wx.setStorageSync("userInfo", tmpUserInfo);
            }
            console.log("用户昵称检测成功：", res.msg);
          })
        })(),
        (() => {
          // 开始用户背景图检测
          bgImg.check()
          .then(res => {
            // 更新本地存储的userInfo中的用户背景图
            bgImgUrl = res.data;
            tmpUserInfo = wx.getStorageSync("curUserProfile");
            tmpUserInfo.bgImgUrl = bgImgUrl
            wx.setStorageSync("userInfo", tmpUserInfo);
            console.log("用户背景图检测成功：", res.msg);
          })
        })(),
        (() => {
          // 开始用户权限检测
          admin.check()
          .then(res => {
            wx.setStorageSync("isAdmin", res.isAdmin);
            console.log("用户权限检测成功：", res.msg);

            if (!res.isAdmin) {
              // 开始用户审核检测
              return auth.check()
            } else {
              wx.setStorageSync("authStatus", "authorized");
              return Promise.resolve({
                isAdmin: true
              });
            }
          })
          .then(res => {
            if (res.isAdmin !== true) {
              wx.setStorageSync("authStatus", res.status);
              console.log("用户审核检测成功：", res.msg);
            }
          })
        })(),
        (async () => {
          await notify.checkDownload();
        })()
      ]).then()
      .catch(err => {
        console.log("用户信息检测失败： ", err)
      })
    }
  })
}

module.exports = {
  getUserInfo: getUserInfoNew,
  download
}