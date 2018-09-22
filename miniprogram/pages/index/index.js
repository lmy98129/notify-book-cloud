//index.js
const app = getApp()
const avatar = require("../../utils/avatar");
const localData = require("../../test/local-data");

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    sideBar: false,
    moveY: 0,
    randRecList: [],
    sameYearRecList: [],
    randListLength: 0,
    fixTop: false,
    fixVeryTop: false,
    specialPhone: ''
  },

  onLoad: function() {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              let avatarUrl = res.userInfo.avatarUrl;
              avatar.check(this, avatarUrl)
              .then(res => {
                console.log("用户头像检测: ", res.msg);
              })
              this.setData({
                avatarUrl: avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })

    // 导入可能认识的人信息
    let rand = localData.rand;
    this.setData({
      randListLength: rand.length
    })
    if (rand.length < 13) {
      for (var i=rand.length; i<13; i++) {
        rand[i] = {avatarUrl: "/pages/index/user-unlogin.png"}
      }
    }
    let year = localData.year;
    this.setData({
      randRecList: rand,
      sameYearRecList: year
    })

    // 获取系统信息
    let sysInfo = wx.getSystemInfoSync();
    switch (sysInfo.model) {
      case "iPhone 5":
      case "iPhone 4":
      case "iPhone 5s":
      case "iPhone se":
        this.setData({
          specialPhone: "ip5"
        });
        break;
      case "iPhone 6":
      case "iPhone 6s":
      case "iPhone 7":
      case "iPhone 8":
        this.setData({
          specialPhone: "ip6"
        });
        break;
      case "iPhone 6 Plus":
      case "iPhone 6s Plus":
      case "iPhone 7 Plus":
      case "iPhone 8 Plus":
        this.setData({
          specialPhone: "ip6p"
        });
        break;
      case "iPhone X":
      case "iPhone Xs":
      case "iPhone Xs Max":
      case "iPhone Xr":
        this.setData({
          specialPhone: "ipx"
        });
        break;
      default:
        break;
    }
  },

  onGetUserInfo: function(e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },

  switchSideBar: function() {
    if (this.data.fixVeryTop) {
      this.setData({
        fixVeryTop: false,
      })
    }
    let sideBar = !this.data.sideBar;
    this.setData({
      sideBar: sideBar
    })
  },
  
  onPageScroll: function(e) {
    if (e.scrollTop > 0) {
      this.setData({
        fixVeryTop: true
      })
    } 
    if (e.scrollTop > 80) {
      this.setData({
        fixTop: true
      })
    } else {
      this.setData({
        fixTop: false,
        fixVeryTop: false
      })
    }
  },

  goProfile() {
    wx.navigateTo({
      url: '../profile/profile',
    })
  }

})
