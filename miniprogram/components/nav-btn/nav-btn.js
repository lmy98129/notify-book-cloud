// components/nav-btn/nav-btn.js
const app = getApp();

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    btnType: {
      type: String,
      value: "",
    },
    iconType: {
      type: String,
      value: ""
    },
    isRedDot: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    tapBtn: function() {
      this.triggerEvent("tapBtn");
    },
    getFormid(e) {
      if (app.globalData.formidArray === undefined) {
        app.globalData.formidArray = [];
      }
      app.globalData.formidArray.push(e.detail.formId);
    }
  }
})
