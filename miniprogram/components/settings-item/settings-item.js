// components/settings-item/settings-item.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    url: {
      type: String,
      value: ""
    },
    title: {
      type: String,
      value: ""
    },
    hint: {
      type: String,
      value: ""
    },
    mode: {
      type: String,
      value: "default",
    },
    settingType: {
      type: String,
      value: "",
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
    bindTap() {
      let props = this.properties;
      this.triggerEvent("tapSettings", {
        settingType: props.settingType,
      });
    }
  }
})
