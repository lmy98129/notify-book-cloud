// components/top-widget/top-widget.js
const sys = require("../../utils/system");
const app = getApp();
const getFormid = require("../../utils/formid").getFormid;

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
    mode: {
      type: String,
      value: "main"
    },
    title: {
      type: String,
      value: ""
    },
    avatarUrl: {
      type: String,
      value: ""
    },
    nickname: {
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
    },
    isNavigateToProfile: {
      type: Boolean,
      value: false
    },
    bgImgUrl: {
      type: String,
      value: ""
    },
    fixVeryTop: {
      type: Boolean,
      value: false
    },
    contactFixTitle: {
      type: String,
      value: ""
    },
    contactFixTitleUsername: {
      type: Boolean,
      value: true
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
    let prop = this.properties;
    let { mode } = prop;
    if (mode === "title") {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#ff0000',
        animation: {
          duration: 400,
          timingFunc: 'easeIn'
        }
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    switchSideBar: function() {
      this.triggerEvent("tapbtn");
    },

    goProfile() {
      let prop = this.properties;
      if (prop.isNavigateToProfile) {
        wx.switchTab({
          url: '../profile/profile',
        })
      }
    },

    getFormid(e) {
      getFormid(e.detail.formId);
    },

    goBack() {
      if (getCurrentPages().length === 1) {
        wx.switchTab({
          url: "/pages/profile/profile"
        })
      } else {
        wx.navigateBack({
          delta: 1
        })
      }
    }
  }
})
