// pages/editProfile/editProfile.js
const avatar = require("../../utils/avatar");
const profile = require("../../utils/profile");
const profModel = require("../../utils/profile-model");
const comfirmOnly = require("../../utils/message").comfirmOnly;
const toast = require("../../utils/message").toast;

const initValue = profModel.initValue;
let newUserInfo = profModel.userInfo;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: "/images/user-unlogin.png",
    nickName: "",
    realName: "",
    gender: "",
    birthDate: "请选择日期",
    homeTown: "请选择籍贯",
    degree: "请选择学历",
    major: "",
    address: "",
    enterSchoolTime: "请选择入校时间",
    leaveSchoolTime: "请选择离校时间",
    wechatId: "",
    phoneNumber: "",
    jobArray: [{
      institution: "",
      job: "",
      jobStartTime: "请选择入职时间",
      jobEndTime: "请选择离职时间"
    }],
    contactArray: [{
      contactType: "",
      content: ""
    }],
    // intro: "",
    degreeArray: ["本科", "硕士", "博士", "其他"],
    pagePos: "请向上滑动页面继续填写",
    canSubmit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userInfo = wx.getStorageSync("userInfo"), tmpArray, tmpDate;
    profile.download().then(res => {
      if (res.code === 1) {
        this.setData({
          avatarUrl: userInfo.avatarUrl,
          gender: userInfo.gender,
          nickName: userInfo.nickName
        })
        newUserInfo.nickName = userInfo.nickName;
        newUserInfo.gender = userInfo.gender;
      } else if (res.code === 2) {
        newUserInfo = res.data;
        delete newUserInfo._id;
        delete newUserInfo._openid;
        this.setData({
          avatarUrl: userInfo.avatarUrl
        })
        for (let item in newUserInfo) {
          switch(item) {
            case "birthDate": 
              tmpDate = newUserInfo[item].split("-");
              this.setData({
                [item]: parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月" + parseInt(tmpDate[2]) + "日"
              });
              break;
            case "enterSchoolTime":
            case "leaveSchoolTime":
              if (newUserInfo[item] === undefined || newUserInfo[item] === "") {
                this.setData({
                  [item]: initValue[item].default
                });
              } else {
                tmpDate = newUserInfo[item].split("-");
                this.setData({
                  [item]: parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月"
                })
              }
              break;
            case "jobArray":
              tmpArray = JSON.parse(JSON.stringify(newUserInfo[item]));
              for(let i=0; i<tmpArray.length; i++) {
                for (let subItem in tmpArray[i]) {
                  if (tmpArray[i][subItem] === undefined || tmpArray[i][subItem] === "") {
                    tmpArray[i][subItem] = initValue[subItem].default;
                    this.setData({
                      [item]: tmpArray
                    });
                  } else if (subItem === "jobStartTime" || subItem === "jobEndTime") {
                    tmpDate = tmpArray[i][subItem].split("-");
                    tmpArray[i][subItem] = parseInt(tmpDate[0]) + "年" + parseInt(tmpDate[1]) + "月";
                    this.setData({
                      [item]: tmpArray
                    });
                  }
                }
              }
              break;
            case "contactArray":
              tmpArray = JSON.parse(JSON.stringify(newUserInfo[item]));
              this.setData({
                [item]: tmpArray
              })
              break;
            default:
              this.setData({
                [item]: newUserInfo[item]
              });
              break;
          }
        }
      }
    }).catch(err => {
      console.log("获取用户资料出错：", err);
    })
  },

  uploadAvatar() {
    let that = this;
    wx.showActionSheet({
      itemList: ["上传自定义头像", "使用微信头像"],
      itemColor: "#333",
      success: function(res) {
        switch(res.tapIndex) {
          case 0:
            avatar.upload(that);
            break;
          case 1:
            avatar.wechat(that);
            break;
        }
      }
    })
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  scrollBottom() {
    this.setData({
      pagePos: "提交",
      canSubmit: true
    })
  },

  bindScroll(e) {
    if (e.detail.deltaY > 0) {
      this.setData({
        pagePos: "请向上滑动页面继续填写",
        canSubmit: false
      })
    }
  },

  getGender(e) {
    let gender = e.detail.gender, inputType = e.detail.inputType;
    newUserInfo[inputType] = gender;
    this.setData({
      gender: parseInt(gender)
    })
    // console.log(newUserInfo);
  },

  inputHandler(e) {
    let inputType = e.detail.inputType, value = e.detail.value, formated, index, tmpArray, arrayType;
    if (e.detail.index != undefined) {
      index = e.detail.index;
    }
    if (e.detail.arrayType != undefined) {
      arrayType = e.detail.arrayType;
    }
    switch(inputType) {
      case "birthDate":
        newUserInfo[inputType] = value;
        formated = value.split("-");
        this.setData({
          [inputType]: parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月" + parseInt(formated[2]) + "日"
        })
        break;
      case "homeTown":
        let homeTown = value[0]+" "+value[1]+" "+value[2];
        newUserInfo[inputType] = homeTown;
        this.setData({
          [inputType]: homeTown
        })
        break;
      case "degree":
        let degree = this.data.degreeArray[value];
        newUserInfo[inputType] = degree;
        this.setData({
          [inputType]: degree
        })
        break;
      case "enterSchoolTime":
      case "leaveSchoolTime":
        newUserInfo[inputType] = value;
        formated = value.split("-");
        this.setData({
          [inputType]: parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月"
        })
        break;
      case "institution":
      case "job":
      case "contactType":
      case "content":
        newUserInfo[arrayType][index][inputType] = value;
        // NOTE: 深拷贝中常用的concat和slice对多维数组以及对象数组是无效的，所以只能用JSON来解决问题了，
        tmpArray = JSON.parse(JSON.stringify(this.data[arrayType]));
        tmpArray[index][inputType] = value;
        this.setData({
          [arrayType]: tmpArray
        })
        break;
      case "jobStartTime":
      case "jobEndTime":
        newUserInfo[arrayType][index][inputType] = value;
        formated = value.split("-");
        tmpArray = JSON.parse(JSON.stringify(this.data[arrayType]));
        tmpArray[index][inputType] = parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
        this.setData({
          [arrayType]: tmpArray
        })
        // console.log("stored: ", newUserInfo[arrayType]);
        // console.log("pages': ", this.data[arrayType]);
        break;
      default:
        newUserInfo[inputType] = value
        break;
    }
    // console.log("current userInfo: ", newUserInfo);    
  },

  addBtn(e) {
    let btnType = e.target.dataset.type, 
      newJobObj = {
        institution: "",
        job: "",
        jobStartTime: "请选择入职时间",
        jobEndTime: "请选择离职时间"
      },
      newContactObj = {
        contactType: "",
        content: ""
      }, newObj;

    if (btnType === 'jobArray') {
      newObj = newJobObj;
    } else {
      newObj = newContactObj;
    }
    
    newUserInfo[btnType].push(newObj);
    let tmpArray = JSON.parse(JSON.stringify(this.data[btnType]));
    tmpArray.push(newObj);
    this.setData({
      [btnType]: tmpArray
    });
  },

  delBtn(e) {
    let index = e.target.dataset.index,
      btnType = e.target.dataset.type;
    newUserInfo[btnType].splice(index, 1);
    let tmpArray = JSON.parse(JSON.stringify(this.data[btnType]));
    tmpArray.splice(index, 1);
    this.setData({
      [btnType]: tmpArray
    })
  },

  pickerDel(e) {
    let inputType = e.detail.inputType, arrayType, index, tmpArray, tmpValue;
    if (e.detail.index != undefined) {
      index = e.detail.index;
    }
    if (e.detail.arrayType != undefined) {
      arrayType = e.detail.arrayType;
    }

    tmpValue = initValue[inputType].default;
    
    switch(inputType) {
      case "jobStartTime":
      case "jobEndTime":
        newUserInfo[arrayType][index][inputType] = tmpValue;
        tmpArray = this.data[arrayType];
        tmpArray[index][inputType] = tmpValue;
        this.setData({
          [arrayType]: tmpArray
        });
        break;
      default:
        newUserInfo[inputType] = tmpValue;
        this.setData({
          [inputType]: tmpValue
        })
    }
    // console.log("current userInfo: ", newUserInfo);
  },

  submit() {
    if (!this.data.canSubmit) return;
    let tmpJobArray, tmpContentArray;
    for(let item in newUserInfo) {
      switch(item) {
        case "nickName":
        case "realName":
        case "major":
        case "address":
          if (newUserInfo[item] === undefined || newUserInfo[item] === "") {
            comfirmOnly(initValue[item].name + "为空，此项为必填项");
            return;
          }
          break;
        case "birthDate":
        case "homeTown":
        case "degree":
        case "enterSchoolTime":
          if(newUserInfo[item] === initValue[item].default) {
            comfirmOnly(initValue[item].name + "为空，此项为必填项");
            return;
          }
          break;
        case "leaveSchoolTime": 
          if (newUserInfo[item] === initValue[item].default) {
            newUserInfo[item] = "";
          }
          break;
        case "contactArray":
          tmpContentArray = newUserInfo[item];
          for (let i=0; i<tmpContentArray.length; i++) {
            for (let subItem in tmpContentArray[i]) {
              if (tmpContentArray[i][subItem] === undefined || tmpContentArray[i][subItem] === "") {
                comfirmOnly("“联系方式" + (i + 1) + "”的"+ initValue[subItem].name + "为空，此项为必填项");
                return;
              }
            }
          }
          break;          
        case "jobArray":
          tmpJobArray = newUserInfo[item];
          for (let i=0; i<tmpJobArray.length; i++) {
            for (let subItem in tmpJobArray[i]) {
              switch(subItem) {
                case "institution":
                case "job":
                  if (tmpJobArray[i][subItem] === undefined || tmpJobArray[i][subItem] === "") {
                    comfirmOnly("“工作职务" + (i + 1) + "”的" + initValue[subItem].name + "为空，此项为必填项");
                    return;
                  }
                  break;
                case "jobStartTime":
                  if (tmpJobArray[i][subItem] === initValue[subItem].default) {
                    comfirmOnly("“工作职务" + (i + 1) + "”的" + initValue[subItem].name + "为空，此项为必填项");
                    return;
                  }
                  break;
                case "jobEndTime": 
                  if (tmpJobArray[i][subItem] === initValue[subItem].default) {
                    newUserInfo[item][i][subItem] = "";
                  }
                  break;
              }
            }
          }
          break;
        case "phoneNumber": 
          if (newUserInfo[item] !== "" && isNaN(newUserInfo[item])) {
            comfirmOnly(initValue[item].name + "应为数字");
            return;
          }
          break;
      }
    }
    console.log("submit userInfo: ", newUserInfo);
    profile.upload(newUserInfo)
    .then(res => {
      console.log("上传用户资料成功：", res);
      toast("资料上传成功");
      let tmpUserInfo = wx.getStorageSync("userInfo");
      tmpUserInfo.nickname = newUserInfo.nickName;
      wx.setStorageSync("userInfo", tmpUserInfo);
    })
    .catch(err => {
      console.log("上传用户资料失败：", err);
      toast("资料上传失败", "none");
    })
  }
})