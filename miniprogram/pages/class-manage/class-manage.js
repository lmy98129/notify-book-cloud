// miniprogram/pages/class-manage/class-manage.js
const toast = require("../../utils/message").toast;

import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    classArray: [],
    isEditModalHidden: true,
    degreeStartTimeForm: "请选择入学时间",
    degreeEndTimeForm: "请选择毕业时间",
    degreeForm: "请选择学历",
    college: "中国传媒大学",
    degree: "",
    school: "电视学院",
    className: "",
    major: "",
    headteacher: "",
    degreeStartTime: "",
    degreeEndTime: "",
    degreeTypeArray: ["本科", "硕士", "博士", "博士后", "专科", "其他"],
    editingIndex: -1,
    selected: [],
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
    await this.download();
  },

  download: async function() {
    try {
      wx.showLoading({
        title: "数据加载中"
      })
      let cloudRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "classInfoDownload",
        }
      })

      wx.hideLoading();

      if (cloudRes.result !== undefined) {
        switch(cloudRes.result.code) {
          case 1:
            this.setData({
              classArray: cloudRes.result.data
            })
            break;
          case -1:
            toast("数据加载失败", "none");            
            break;
        }
      }

    } catch (error) {
      wx.hideLoading();
      console.log(error.message);
      toast("数据加载失败", "none");
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

  },

  modalTouchMove(e) {

  },

  showEditModal(e) {
    if (e.target.dataset.index !== undefined) {
      let { index } = e.target.dataset;
      let { classArray } = this.data;
      let tmpObj = classArray[index];
      for (let key in tmpObj) {
        switch(key) {
          case "degreeStartTime":
          case "degreeEndTime":
            if (tmpObj[key] !== "") {
              let formated = tmpObj[key].split("-");
              tmpObj[key+"Form"] = parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
            } else {
              if (key === "degreeStartTime") {
                tmpObj[key+"Form"] = "请选择入学时间";
              } else {
                tmpObj[key+"Form"] = "请选择毕业时间";
              }
            }
            break;
          case "degree":
            if (tmpObj[key] !== "") {
              tmpObj[key+"Form"] = tmpObj[key];
            } else {
              tmpObj[key+"Form"] = "请选择学历";
            }
            break;
        }
      }
      tmpObj.isEditModalHidden = false;
      tmpObj.editingIndex = index;
      this.setData(tmpObj);
    } else {
      this.setData({
        degreeStartTimeForm: "请选择入学时间",
        degreeEndTimeForm: "请选择毕业时间",
        degreeForm: "请选择学历",
        school: "电视学院",
        college: "中国传媒大学",
        degree: "",
        className: "",
        major: "",
        headteacher: "",
        degreeStartTime: "",
        degreeEndTime: "",
        isEditModalHidden: false,
      })
    }
  },

  hideEditModal() {
    this.setData({
      degreeStartTimeForm: "请选择入学时间",
      degreeEndTimeForm: "请选择毕业时间",
      degreeForm: "请选择学历",
      school: "电视学院",
      college: "中国传媒大学",
      degree: "",
      className: "",
      major: "",
      headteacher: "",
      degreeStartTime: "",
      degreeEndTime: "",
      isEditModalHidden: true,
      editingIndex: -1,
    })
  },

  pickerDel(e) {
    let { inputType } = e.detail;
    switch(inputType) {
      case "degreeStartTime":
        this.setData({
          [inputType + "Form"]: "请选择入学时间",
          [inputType]: ""
        })
        break;
      case "degreeEndTime":
        this.setData({
          [inputType + "Form"]: "请选择毕业时间",
          [inputType]: ""
        })
        break;
      case "degree":
        this.setData({
          [inputType + "Form"]: "请选择学历",
          [inputType]: ""
        })
    }
  },

  inputHandler(e) {
    let { inputType, value } = e.detail;
    switch(inputType) {
      case "className":
      case "major":
      case "headteacher":
      case "school":
      case "college":
        this.setData({
          [inputType]: value
        })
        break;
      case "degreeStartTime":
      case "degreeEndTime":
        let formated = value.split("-");
        this.setData({
          [inputType + "Form"]: parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月",
          [inputType]: value,
        })
        break;
      case "degree":
        let { degreeTypeArray } = this.data;
        this.setData({
          [inputType + "Form"]: degreeTypeArray[value],
          [inputType]: degreeTypeArray[value]
        });
        break;
    }
  },

  edit: async function() {
    let { className, major, headteacher, school, degree, college,
        degreeStartTime, degreeEndTime, editingIndex, classArray } = this.data;
    let cloudRes;
    if (className === undefined || className === "") {
      toast("请输入班级名称", "none");
      return;
    }
    if (major === undefined || major === "") {
      toast("请输入班级对应的专业", "none");
      return;
    }
    if (school === undefined || school === "") {
      toast("请输入学院名称", "none");
      return;
    }
    if (college === undefined || college === "") {
      toast("请输入学校名称", "none");
      return;
    }
    // 由于丢失的班主任信息较多，先不检查这个
    // if (headteacher === undefined || headteacher === "") {
    //   toast("请输入班级对应的班主任姓名", "none");
    //   return;
    // }
    if (degree === undefined || degree === "") {
      toast("请选择学历", "none");
      return;
    }
    let newClassInfo = { className, major, headteacher, degree, school, college, degreeStartTime, degreeEndTime };

    try {
      wx.showLoading({
        title: "上传数据中"
      });

      if (editingIndex !== -1) {
        let { _id } = classArray[editingIndex];
        cloudRes = await wx.cloud.callFunction({
          name: "profile-manage",
          data: {
            $url: "classInfoUpdate",
            newClassInfo,
            _id,
          }
        })
      } else {
        cloudRes = await wx.cloud.callFunction({
          name: "profile-manage",
          data: {
            $url: "classInfoAdd",
            newClassInfo,
          }
        })
      }
      

      wx.hideLoading();

      if (cloudRes.result) {
        switch(cloudRes.result.code) {
          case 1:
            console.log("数据上传成功", cloudRes.result);
            this.hideEditModal();
            await this.download();
            break;
          case -1:
            console.log("数据上传出错", cloudRes.result);
            toast("上传数据出错", "none");
            break;
        }
      }
    } catch (error) {
      console.log(error.message);
      wx.hideLoading();
      toast("上传数据出错", "none");
    }

  },

  bindSelected(e) {
    let { value } = e.detail;
    this.setData({
      selected: value
    })
  },

  delete: async function() {
    try {
      let { selected } = this.data;
      if (selected.length <= 0) {
        toast("请至少选择一条信息", "none");
        return;
      }

      wx.showLoading({
        title: "上传数据中"
      });


      let cloudRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "classInfoDelete",
          selected,
        }
      })

      wx.hideLoading();

      if (cloudRes.result) {
        switch(cloudRes.result.code) {
          case 1:
            console.log("数据上传成功", cloudRes.result);
            await this.download();
            break;
          case -1:
            console.log("数据上传出错", cloudRes.result);
            toast("上传数据出错", "none");
            break;
        }
      }

    } catch (error) {
      console.log(error.message);
      wx.hideLoading();
      toast("上传数据出错", "none");
    }
  }

})