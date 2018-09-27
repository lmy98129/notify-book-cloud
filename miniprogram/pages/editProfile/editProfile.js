// pages/editProfile/editProfile.js
const app = getApp();
const login = require("../../utils/login");
let newUserInfo = {}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: "",
    userInfo: "",
    gender: "",
    birthDate: "请选择日期",
    homeTown: "请选择籍贯",
    realName: "",
    degree: "请选择学历",
    degreeArray: ["本科", "硕士", "博士", "其他"],
    enterSchoolTime: "请选择入校时间",
    leaveSchoolTime: "请选择离校时间"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let userInfo = wx.getStorageSync("userInfo");
    this.setData({
      avatarUrl: userInfo.avatarUrl,
      userInfo: userInfo,
      gender: userInfo.gender,
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

  getNickname(e) {
    newUserInfo.nickName = e.detail.value;
  },

  getGender(e) {
    let gender = e.target.dataset.gender;
    newUserInfo.gender = gender;
    this.setData({
      gender: parseInt(gender)
    })
  },

  getBirthDate(e) {
    let birthDate = e.detail.value;
    newUserInfo.birthDate = birthDate;
    let formated = birthDate.split("-");
    this.setData({
      birthDate: parseInt(formated[0])+"年"+parseInt(formated[1])+"月"+parseInt(formated[2])+"日"
    })
  },

  getHomeTown(e) {
    let homeTown = e.detail.value;
    newUserInfo.homeTown = homeTown;
    this.setData({
      homeTown: homeTown[0] + " " + homeTown[1] + " " + homeTown[2]
    })
  },

  getRealName(e) {
    newUserInfo.realName = e.detail.value;
  },

  getWechatNumber(e) {
    newUserInfo.wechatNumber = e.detail.value;
  },

  getDegree(e) {
    let degree = this.data.degreeArray[e.detail.value];
    newUserInfo.degree = degree;
    this.setData({
      degree: degree
    })
  },

  getMajor(e) {
    newUserInfo.major = e.detail.value;
  },

  getBirthDate(e) {
    let birthDate = e.detail.value;
    newUserInfo.birthDate = birthDate;
    let formated = birthDate.split("-");
    this.setData({
      birthDate: parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月" + parseInt(formated[2]) + "日"
    })
  },

  getEnterSchoolTime(e) {
    let enterSchoolTime = e.detail.value;
    newUserInfo.enterSchoolTime = enterSchoolTime;
    let formated = enterSchoolTime.split("-");
    this.setData({
      enterSchoolTime: parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月"
    })
  },

  getLeaveSchoolTime(e) {
    let leaveSchoolTime = e.detail.value;
    newUserInfo.leaveSchoolTime = leaveSchoolTime;
    let formated = leaveSchoolTime.split("-");
    this.setData({
      leaveSchoolTime: parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月"
    })
  },
})