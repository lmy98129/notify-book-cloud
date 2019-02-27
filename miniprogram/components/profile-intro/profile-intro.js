// components/profile-intro/profile-intro.js
const profile = require("../../utils/profile");


Component({
  /**
   * 组件的属性列表
   */
  properties: {
    intro: {
      type: String,
      value: ""
    },
    mode: {
      type: String,
      value: ""
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    introStatus: "default",
    tmpIntro: ""
  },

  /**
   * 组件的方法列表
   */
  methods: {
    addIntro() {
      this.setData({
        introStatus: "editing"
      })
    },

    cancelIntro() {
      this.setData({
        introStatus: "default",
      })
    },
  
    introInput(e) {
      this.setData({
        tmpIntro: e.detail.value
      })
    },
    
    submitIntro() {
      let { tmpIntro, mode, index } = this.data
      if (mode === "profileManageDataTmp") {
        profile.introUploadForManage(this, tmpIntro, mode, index);
      } else {
        profile.introUpload(this, tmpIntro);
      }
    },
  },
  attached() {
    let props = this.properties;
    this.setData({
      tmpIntro: props.intro
    })
  }
})
