// components/top-widget/top-widget.js
const sys = require("../../utils/system");
Component({
  /**
   * 组件的设置
   */
  options: {
    multipleSlots: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    avatarUrl: {
      type: String,
      value: ""
    },
    fixTop: {
      type: Boolean,
      value: false
    },
    isBack: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    specialPhone: "",
  },

  attached: function() {
    sys.checkPhone(this);
  },

  /**
   * 组件的方法列表
   */
  methods: {
    switchSideBar: function() {
      this.triggerEvent("tapbtn");
    },

    goProfile() {
      wx.navigateTo({
        url: '../profile/profile?isOtherUser=false',
      })
    },

    goBack() {
      wx.navigateBack({
        delta: 1
      })
    }
  }
})
