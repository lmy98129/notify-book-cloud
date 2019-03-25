// miniprogram/pages/permission-setting/permission-setting.js
const settings = require('../../utils/settings');
const profile = require('../../utils/profile');
const schema = require('../../utils/profile-model').SCHEMA;
const STATUS = require('../../utils/profile-model').PERMISSION_STATUS;
const toast = require('../../utils/message').toast;

import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";


Page({

  /**
   * 页面的初始数据
   */
  data: {
    permissionSetting: {},
    permissionTypeArray: [],
    isEditModalHidden: true,
    currentStatus: "",
    currentKey: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {
    try {
      let curUserProfile = await profile.check();
      let { _openid } = curUserProfile;
      let permissionSetting = await settings.downloadSetting(_openid);
      // 浅拷贝，直接修改了模块暴露的值本身，这里用JSON进行一次深拷贝
      permissionSetting = JSON.parse(JSON.stringify(permissionSetting));
      for (let key in permissionSetting) {
        let { name } = schema[key];
        let value = permissionSetting[key];
        let valueName = "";
        switch(value) {
          case STATUS.ALL:
            valueName = "所有人可见";
            break;
          case STATUS.ALL_NOT:
            valueName = "所有人不可见";
            break;
          case STATUS.SAME_CLASS:
            valueName = "仅同班同学可见";
            break;
        }
        permissionSetting[key] = { value, name, valueName };
      }
      let permissionTypeArray = ["所有人可见", "所有人不可见", "仅同班同学可见"];
      this.setData({
        permissionSetting,
        permissionTypeArray,
      })
    } catch (error) {
      toast("设置加载失败");
      console.log(error);
    }
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
    this.setData({
      permissionTypeArray: []
    })
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

  modalTouchMove(e) {

  },

  showEditModal(e) {
    let { settingType } = e.detail;
    let { permissionSetting } = this.data;
    let currentStatus = permissionSetting[settingType].valueName;
    this.setData({
      currentStatus,
      isEditModalHidden: false,
      currentKey: settingType,
    })
  },

  hideEditModal() {
    this.setData({
      currentStatus: "",
      isEditModalHidden: true,
    })
  },

  inputHandler(e) {
    let { value } = e.detail;
    let { permissionTypeArray } = this.data;
    let currentStatus = permissionTypeArray[value];
    this.setData({
      currentStatus,
    })
  },

  async edit() {
    try {
      let curUserProfile = await profile.check();
      let { _openid } = curUserProfile;
      wx.showLoading({ title: '数据上传中' });
      let { currentStatus, currentKey, permissionSetting, permissionTypeArray } = this.data;
      let typeIndex = permissionTypeArray.indexOf(currentStatus);
      let value;
      switch(typeIndex) {
        case 0:
          value = STATUS.ALL;
          break;
        case 1:
          value = STATUS.ALL_NOT;
          break;
        case 2:
          value = STATUS.SAME_CLASS;
          break;
      }
      permissionSetting[currentKey].value = value;
      permissionSetting[currentKey].valueName = currentStatus;
      this.setData({
        permissionSetting,
      })
      
      let tmpPermissionSetting = JSON.parse(JSON.stringify(permissionSetting));

      for (let key in permissionSetting) {
        tmpPermissionSetting[key] = tmpPermissionSetting[key].value;
      }

      this.hideEditModal();
      
      await settings.upload(_openid, tmpPermissionSetting);

      wx.hideLoading();

      toast('上传用户设置成功', "success");
    } catch (error) {
      wx.hideLoading();
      this.hideEditModal();
      console.log(error);
      toast('上传用户设置出错');
    }
  }
})