// pages/profile-edit/profile-edit.js
const app = getApp();
const avatar = require("../../utils/avatar");
const profile = require("../../utils/profile");
const profModel = require("../../utils/profile-model");
const confirmOnly = require("../../utils/message").confirmOnly;
const toast = require("../../utils/message").toast;
const getFormid = require("../../utils/formid").getFormid;
const formid = require("../../utils/formid");

const initValue = profModel.initValue;
const initUserInfo = JSON.parse(JSON.stringify(profModel.userInfo));
let newUserInfo = JSON.parse(JSON.stringify(profModel.userInfo));

const sortByNum = (x, y) => {
  let xNum = x.match(/[0-9]+/ig);
  let yNum = y.match(/[0-9]+/ig);
  if (xNum !== null && yNum !== null) {
    return parseInt(xNum[0]) - parseFloat(yNum[0]);
  } else if (xNum === null && xNum === null ) {
    return 0;
  } else {
    console.log(x, y);
    return xNum == null ? -1 : 1; 
  }
}

import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

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
    contactArray: [],
    // intro: "",
    degreeArray: [{
      degree: "请选择学历",
      school: "",
      major: "",
      className: "",
      headteacher: "",
      degreeStartTime: "请选择入学时间",
      degreeEndTime: "请选择毕业时间",
    }],
    degreeTypeArray: ["本科", "硕士", "博士", "博士后", "专科", "其他"],
    pagePos: "请向上滑动页面继续填写",
    canSubmit: false,
    mode: "",
    index: 0,
    isChooseInitTypeModalHidden: true,
    isChooseProfile: false,
    realNameForInitProfile: "",
    tmpInitProfile: [],
    selectedInitProfile: "",
    classNameArray: [],
    classInfoArray: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    try {
      wx.showLoading({
        title: "数据加载中"
      })
      let { mode, index } = options;
      let curUserProfile, tmpClassNameArray;
  
      let classInfoRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "classInfoDownload"
        }
      })
  
      if (classInfoRes.result) {
        let { classNameArray, data } = classInfoRes.result;
        classNameArray.sort(sortByNum).reverse();
        classNameArray.splice(0, 0, "其他班级");
        tmpClassNameArray = classNameArray;
        this.setData({ classNameArray, classInfoArray: data });
      }
  
      // 来源为本地存储值
      if (mode !== undefined && mode !== "" && mode !== "addProfileManage") {
        this.setData({ mode, index });
        curUserProfile = wx.getStorageSync(mode)[index];
        newUserInfo = profile.decodeForEdit(curUserProfile, initValue, initUserInfo, tmpClassNameArray, this);
      // 管理员自行添加
      } else if (mode === "addProfileManage") {
        let gender = 1;
        newUserInfo.gender = gender;
        newUserInfo.jobArray = [];
        newUserInfo.degreeArray = [];
        newUserInfo.contactArray = [];
        this.setData({ mode, gender,
          jobArray: [], degreeArray: []
        });
        return;
      // 默认资料
      } else {
        curUserProfile = await profile.check();
        if (curUserProfile.isProfileEmpty) {
          let { avatarUrl, nickName, gender } = curUserProfile;
          if (gender <= 0) gender = 1;
          this.setData({ avatarUrl, nickName, gender, isChooseInitTypeModalHidden: false });
          newUserInfo = { ...newUserInfo, avatarUrl, nickName, gender };
        } else {
          newUserInfo = profile.decodeForEdit(curUserProfile, initValue, initUserInfo, tmpClassNameArray, this);
        }
      } 
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.log("数据加载失败", error.message);
      toast("数据加载失败", "none");
    }
  },

  uploadAvatar() {
    let that = this;
    let { mode, index } = this.data;

    if (mode !== undefined && mode !== "" && mode !== "addProfileManage") {
      wx.showActionSheet({
        itemList: ["上传自定义头像", "使用默认头像"],
        itemColor: "#333",
        success: function(res) {
          switch(res.tapIndex) {
            case 0:
              avatar.uploadForManage(that, mode, index);
              break;
            case 1:
              avatar.defaultForManage(that, mode, index);
              break;
          }
        }
      })
    } else if (mode === "addProfileManage") {
      confirmOnly("暂不支持在新建资料成功之前上传头像。请在新建资料提交成功后，再通过校友资料管理页面该资料最右侧的“编辑”按钮进入本页面，进行修改头像操作。")
    } else {
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
    }
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
    formid.upload()
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
    newUserInfo = JSON.parse(JSON.stringify(profModel.userInfo));
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
        let degree = this.data["degreeTypeArray"][value];
        newUserInfo[arrayType][index][inputType] = degree;
        tmpArray = JSON.parse(JSON.stringify(this.data[arrayType]));
        tmpArray[index][inputType] = degree;
        this.setData({
          [arrayType]: tmpArray
        })
        break;
      case "institution":
      case "job":
      case "school":
      case "major":
      case "headteacher":
      case "contactType":
      case "content":
      case "className":
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
      case "degreeStartTime":
      case "degreeEndTime":
        newUserInfo[arrayType][index][inputType] = value;
        formated = value.split("-");
        tmpArray = JSON.parse(JSON.stringify(this.data[arrayType]));
        tmpArray[index][inputType] = parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
        this.setData({
          [arrayType]: tmpArray
        })

        break;
      default:
        newUserInfo[inputType] = value
        break;
    }
    // console.log("current userInfo: ", newUserInfo);    
  },

  addBtn(e) {
    let btnType = e.target.dataset.type, newObj;
    newObj = JSON.parse(JSON.stringify(profModel.userInfo[btnType][0]));
    
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
      case "degreeStartTime":
      case "degreeEndTime":
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

  getFormid(e) {
    getFormid(e.detail.formId);
  },

  submit() {
    formid.upload()
    let { canSubmit, mode, index, isChooseProfile, selectedInitProfile } = this.data;
    console.log(newUserInfo);
    if (!canSubmit) return;
    let tmpJobArray, tmpContentArray, tmpDegreeArray;
    if (mode === undefined || mode === "") {
      for(let item in newUserInfo) {
        switch(item) {
          // 处理普通input类型的必填项
          case "nickName":
          case "realName":
          case "address":
          case "phoneNumber":
            if (newUserInfo[item] === undefined || newUserInfo[item] === "") {
              confirmOnly(initValue[item].name + "为空，此项为必填项");
              return;
            }
            break;
          // 处理picker类型的必填项
          case "birthDate":
          case "homeTown":
            if(newUserInfo[item] === initValue[item].default) {
              confirmOnly(initValue[item].name + "为空，此项为必填项");
              return;
            }
            break;
          // 处理数组内部的必填项目
          case "contactArray":
            tmpContentArray = newUserInfo[item];
            for (let i=0; i<tmpContentArray.length; i++) {
              for (let subItem in tmpContentArray[i]) {
                if (tmpContentArray[i][subItem] === undefined || tmpContentArray[i][subItem] === "") {
                  confirmOnly("“联系方式" + (i + 1) + "”的"+ initValue[subItem].name + "为空，此项为必填项");
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
                      confirmOnly("“工作职务" + (i + 1) + "”的" + initValue[subItem].name + "为空，此项为必填项");
                      return;
                    }
                    break;
                  case "jobStartTime":
                    if (tmpJobArray[i][subItem] === initValue[subItem].default) {
                      confirmOnly("“工作职务" + (i + 1) + "”的" + initValue[subItem].name + "为空，此项为必填项");
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
          case "degreeArray":
            tmpDegreeArray = newUserInfo[item];
            for (let i=0; i<tmpDegreeArray.length; i++) {
              for (let subItem in tmpDegreeArray[i]) {
                switch(subItem) {
                  case "className":
                    if (tmpDegreeArray[i][subItem] === undefined || tmpDegreeArray[i][subItem] === "" || tmpDegreeArray[i][subItem] === initUserInfo[item][0][subItem]) {
                      confirmOnly("“学历信息" + (i + 1) + "”的" + initValue[subItem].name + "为空，此项为必填项");
                      return;
                    }
                    break;
                  case "school":
                  case "major":
                    if (tmpDegreeArray[i][subItem] === undefined || tmpDegreeArray[i][subItem] === "") {
                      confirmOnly("“学历信息" + (i + 1) + "”的" + initValue[subItem].name + "为空，此项为必填项");
                      return;
                    }
                    break;
                  case "degree":
                  case "degreeStartTime":
                    if (tmpDegreeArray[i][subItem] === initValue[subItem].default) {
                      confirmOnly("“学历信息" + (i + 1) + "”的" + initValue[subItem].name + "为空，此项为必填项");
                      return;
                    }
                    break;
                  case "degreeEndTime":
                    if (tmpDegreeArray[i][subItem] === initValue[subItem].default) {
                      newUserInfo[item][i][subItem] = "";
                    }
                    break;
                }
              }
            }
            break;
          case "phoneNumber": 
            if (newUserInfo[item] !== "" && isNaN(newUserInfo[item])) {
              confirmOnly(initValue[item].name + "应为数字");
              return;
            }
            break;
        }
      }
    }
    console.log("上传用户资料：", newUserInfo);
    if (mode !== "" && mode !== undefined && mode !== "addProfileManage") {
      profile.uploadForManage(newUserInfo, mode, index);
    } else if (mode === "addProfileManage") {
      profile.uploadForAddProflieManage(newUserInfo);
    } else {
      profile.upload(newUserInfo);
    }
    if (isChooseProfile) {
      profile.deleteOldProfile(selectedInitProfile);
    }
  },

  modalTouchMove(e) {

  },

  goBack() {
    if (getCurrentPages().length === 1) {
      wx.switchTab({
        url: "/pages/index/index"
      })
    } else {
      wx.navigateBack({
        delta: 1
      })
    }
  },

  editBySelf() {
    this.setData({
      isChooseInitTypeModalHidden: true,
    })
  },

  chooseProfile() {
    this.setData({
      isChooseProfile: true,
    })
  },

  setRealNameForInitProfile(e) {
    let { value } = e.detail;
    this.setData({
      realNameForInitProfile: value,
    })
  },

  findProfile: async function() {
    try {
      let { realNameForInitProfile } = this.data;
      let realName = realNameForInitProfile;

      wx.showLoading({
        title: "请求数据中"
      });

      let cloudRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "findProfile",
          realName,
          collection: "profile-new"
        }
      })

      wx.hideLoading();

      if (cloudRes.result) {
        switch(cloudRes.result.code) {
          case 1:
            if (cloudRes.result.data.length <= 0) {
              toast("暂无匹配资料", "none");
              return;
            }
            let tmpInitProfile = cloudRes.result.data;
            this.setData({
              tmpInitProfile
            })
            wx.setStorage({ key: "tmpInitProfile", data: tmpInitProfile });
            break;
          case -1:
            toast("请求数据出错", "none");
            break;
        }
      }

    } catch (error) {
      toast("请求数据出错", "none");
      wx.hideLoading();
      console.log(error.message);
    }
  },

  selectInitProfile(e) {
    let { value } = e.detail;
    this.setData({
      selectedInitProfile: value,
    })
  },

  selectedProfile: async function() {
    let { selectedInitProfile, tmpInitProfile, classNameArray } = this.data;
    if (selectedInitProfile == undefined || selectedInitProfile == "") {
      toast("请至少选择一个选项", "none");
      return;
    }
    let tmpUserProfile = tmpInitProfile[tmpInitProfile.findIndex(x => x._id === selectedInitProfile)];
    newUserInfo = profile.decodeForEdit(tmpUserProfile, initValue, initUserInfo, classNameArray, this);

    let curUserProfile = await profile.check();
    let { avatarUrl = app.globalData.DEFAULT_AVATARURL, nickName = "", gender = 1 } = curUserProfile;
    newUserInfo = { ...newUserInfo, avatarUrl, nickName, gender };
    this.setData({
      realNameForInitProfile: "",
      tmpInitProfile: [],
      isChooseInitTypeModalHidden: true,
    })
  },

  setClassName(e) {
    let { value, index, arrayType } = e.detail;
    let { classNameArray, classInfoArray } = this.data;
    let tmpArray = JSON.parse(JSON.stringify(this.data[arrayType]));
    newUserInfo[arrayType][index].className = classNameArray[value];
    tmpArray[index].className = classNameArray[value];
    if (classNameArray[value] === "其他班级") {
      newUserInfo[arrayType][index].className = "";
      tmpArray[index].classNameExtra = "";
    } else {
      // 删除之前的extra内容，并且填写上该班级的所有信息
      if (tmpArray[index].classNameExtra) {
        delete tmpArray[index].classNameExtra
      }
      let tmpIndex = classInfoArray.findIndex(x => x.className === classNameArray[value]);
      let { _id, ...tmpClassInfo} = classInfoArray[tmpIndex];
      let tmpClassInfoNew = JSON.parse(JSON.stringify(tmpClassInfo));
      if (tmpClassInfo.degreeStartTime === undefined || tmpClassInfo.degreeStartTime === "") {
        tmpClassInfo.degreeStartTime = initUserInfo[arrayType][0].degreeStartTime;
        tmpClassInfoNew.degreeStartTime = initUserInfo[arrayType][0].degreeStartTime;
      } else {
        let formated = tmpClassInfo.degreeStartTime.split("-");
        tmpClassInfo.degreeStartTime = parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
      }
      if (tmpClassInfo.degreeEndTime === undefined || tmpClassInfo.degreeEndTime === "") {
        tmpClassInfo.degreeEndTime = initUserInfo[arrayType][0].degreeEndTime;
        tmpClassInfoNew.degreeEndTime = initUserInfo[arrayType][0].degreeEndTime;
      } else {
        let formated = tmpClassInfo.degreeEndTime.split("-");
        tmpClassInfo.degreeEndTime = parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
      }
      newUserInfo[arrayType][index] = tmpClassInfoNew;
      tmpArray[index] = tmpClassInfo;
    }
    this.setData({
      [arrayType]: tmpArray
    });
  },

  classNamePickerDel(e) {
    let { index, arrayType } = e.detail;
    let tmpArray = JSON.parse(JSON.stringify(this.data[arrayType]));
    if (newUserInfo[arrayType][index].classNameExtra) {
      delete newUserInfo[arrayType][index].classNameExtra;
    }
    if (tmpArray[index].classNameExtra) {
      delete tmpArray[index].classNameExtra
    }
    newUserInfo[arrayType][index].className = initUserInfo[arrayType][0].className;
    tmpArray[index].className = initUserInfo[arrayType][0].className;
    this.setData({
      [arrayType]: tmpArray
    })
  },

  setClassNameExtra(e) {
    let { index, arrayType, value } = e.detail;
    let tmpArray = JSON.parse(JSON.stringify(this.data[arrayType]));
    newUserInfo[arrayType][index].className = value;
    tmpArray[index].classNameExtra = value;
    this.setData({
      [arrayType]: tmpArray
    })   
  }

})