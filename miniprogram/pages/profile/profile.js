// pages/profile/profile.js
const sys = require("../../utils/system");
const profile = require("../../utils/profile");
const profModel = require("../../utils/profile-model");


Page({

  /**
   * 页面的初始数据
   */
  data: {
    specialPhone: '',
    avatarUrl: "/images/user-unlogin.png",
    nickname: "",
    userInfo: [],
    contactArray: [],
    jobArray: [],
    profileStatus: 0,
    fixTop: false,
    fixVeryTop: false,
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
    let avatarUrl = tmpUserInfo.avatarUrl;
    let nickname = tmpUserInfo.nickname;
    this.setData({
      avatarUrl: avatarUrl,
      nickname: nickname,
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
            }
          }

          tmpArray = [];
          for (let subItem in profModel.userInfo) {
            for (let item in tmpUserInfo) {
              if (subItem === item && item !== "nickName") 
                tmpArray.push({
                  title: profModel.initValue[item].name,
                  content: tmpUserInfo[item]
                });
            }
          }
          this.setData({
            userInfo: tmpArray
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