// pages/profile/profile.js
const sys = require("../../utils/system");
const profile = require("../../utils/profile");
const profModel = require("../../utils/profile-model");
const toast = require("../../utils/message").toast;
const bgImg = require("../../utils/bg-img");

let swiperFirstHeight;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    specialPhone: '',
    avatarUrl: "/images/user-unlogin.png",
    bgImgUrl: "",
    nickname: "",
    userInfo: [],
    contactArray: [],
    jobArray: [],
    profileStatus: 0,
    fixTop: false,
    fixVeryTop: false,
    tabIndex: 0,
    swiperHeight: 0,
    introStatus: "default",
    intro: "",
    tmpIntro: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // if (options.isOtherUser) {
      
    // }
    sys.checkPhone(this);

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let tmpUserInfo = wx.getStorageSync("userInfo"), tmpDate, tmpArray, newTmpArray, tmpObj;
    let avatarUrl = tmpUserInfo.avatarUrl,
      nickname = tmpUserInfo.nickName,
      bgImgUrl = tmpUserInfo.bgImgUrl;
    this.setData({
      avatarUrl: avatarUrl,
      nickname: nickname,
      bgImgUrl: bgImgUrl
    })
    profile.download()
      .then(res => {
        console.log("获取用户资料成功：", res);
        if (res.code === 2) {
          tmpUserInfo = res.data;
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
                this.setData({
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
                this.setData({
                  [item]: newTmpArray
                })
                delete tmpUserInfo[item];
                break;
              case "intro":
                this.setData({
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
          
          let tmpArrayLength = tmpArray.length;
          let jobArrayLength = this.data.jobArray.length;
          let contactArrayLength = this.data.contactArray.length;
          swiperFirstHeight = 55 * tmpArrayLength + 50 + 40 * contactArrayLength + 250 * jobArrayLength;
          let phone = wx.getSystemInfoSync().model;
          switch (phone) {
            case "iPhone 5":
            case "iPhone 4":
            case "iPhone 5s":
            case "iPhone se":
              swiperFirstHeight -= 280;
              break;
            case "iPhone 6":
            case "iPhone 6s":
            case "iPhone 7":
            case "iPhone 8":
              swiperFirstHeight -= 50;
              break;
          }
          this.setData({
            userInfo: tmpArray,
            profileStatus: 1,
            swiperHeight: swiperFirstHeight
          });
        } else if (res.code === 1) {
          this.setData({
            profileStatus: -1
          })
        }
      })
      .catch(err => {
        console.log("获取用户资料出错：", err);
        this.setData({
          profileStatus: -2
        })
      })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  tabHandler(e) {
    let index = parseInt(e.target.dataset.index), that = this;
    this.setData({
      tabIndex: index
    })
    wx.createSelectorQuery().select('#intro').fields({
      rect: true,
      size: true,
    }, function (res) {
      sys.adjustSwiper(
        swiperFirstHeight, index, res.height, that
      );
    }).exec();
  },

  bindSwiper(e) {
    let index = e.detail.current, that = this;
    this.setData({
      tabIndex: index
    });
    wx.createSelectorQuery().select('#intro').fields({
      rect: true,
      size: true,
    }, function(res) {
      sys.adjustSwiper(
        swiperFirstHeight, index, res.height, that
      );
    }).exec();
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

  addIntro() {
    this.setData({
      introStatus: "editing"
    })
  },

  cancelIntro() {
    this.setData({
      introStatus: "default",
    })
  },

  introInput(e) {
    this.setData({
      tmpIntro: e.detail.value
    })
  },
  
  submitIntro() {
    let that = this;
    wx.showLoading({
      title: "数据提交中"
    })
    profile.introUpload(this.data.tmpIntro)
    .then(res => {
      wx.hideLoading();
      toast("提交成功");
      console.log("自我介绍上传成功：", res);
      that.setData({
        introStatus: 'default',
        intro: this.data.tmpIntro
      });
      wx.createSelectorQuery().select('#intro').fields({
        rect: true,
        size: true,
      }, function (res) {
        sys.adjustSwiper(
          swiperFirstHeight, that.data.tabIndex, res.height, that
        );
      }).exec();
    })
    .catch(err => {
      wx.hideLoading();
      toast("错误：提交失败", "none");
      console.log("自我介绍上传成功：", err);
    })
  },

  customBgImg() {
    let that = this;
    wx.showActionSheet({
      itemList: ["上传自定义背景图片", "使用默认背景图片"],
      itemColor: "#333",
      success: function(res) {
        switch(res.tapIndex) {
          case 0:
            bgImg.upload(that);
            break;
          case 1:
            bgImg.default(that);
            break;
        }
      }
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }, 


  editProfile: function() {
    wx.navigateTo({
      url: '../editProfile/editProfile',
    })
  },

})