// components/tab-bar/tab-bar.js
Component({
  externalClasses: ['tabbar-custom'],
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
    tabContent: {
      type: Array,
      value: []
    },
    tabIndex: {
      type: Number,
      value: 0
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
    tabHandler(e) {
      let { index } = e.target.dataset;
      this.triggerEvent("change", { index });
      this.setData({
        tabIndex: parseInt(index)
      })
    }
  }
})
