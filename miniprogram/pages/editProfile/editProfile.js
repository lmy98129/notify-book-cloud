// pages/editProfile/editProfile.js
const app = getApp();
const login = require("../../utils/login");
let newUserInfo = {
  nickName: "",
  realName: "",
  gender: "",
  birthDate: "",
  homeTown: "",
  degree: "",
  major: "",
  address: "",
  enterSchoolTime: "",
  leaveSchoolTime: "",
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
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: "",
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
    degreeArray: ["本科", "硕士", "博士", "其他"],
    pagePos: "请向上滑动页面继续填写",
    canSubmit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userInfo = wx.getStorageSync("userInfo");
    this.setData({
      avatarUrl: userInfo.avatarUrl,
      gender: userInfo.gender,
      nickName: userInfo.nickName
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
    console.log(newUserInfo);
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
        console.log("stored: ", newUserInfo[arrayType]);
        console.log("pages': ", this.data[arrayType]);
        break;
      default:
        newUserInfo[inputType] = value
        break;
    }
    console.log("current userInfo: ", newUserInfo);    
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
  }
})