// components/profile-input/profile-input.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    mode: {
      type: String,
      value: "normal"
    },
    gender: {
      type: Number,
      value: 2,
    },
    inputType: {
      type: String,
      value: ""
    },
    title: {
      type: String,
      value: ""
    },
    value: {
      type: String,
      value: ""
    },
    pickerMode: {
      type: String,
      value: "date"
    },
    pickerFields: {
      type: String,
      value: ""
    },
    pickerRange: {
      type: Array,
      value: []
    },
    asterisk: {
      type: Boolean,
      value: true
    },
    placeHolder: {
      type: String,
      value: ""
    },
    index: {
      type: Number,
      value: undefined
    },
    arrayType: {
      type: String,
      value: undefined
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
    bindInput(e) {
      let props = this.properties;
      this.triggerEvent("input", {
        value: e.detail.value,
        inputType: props.inputType,
        index: props.index,
        arrayType: props.arrayType
      });
    },

    getGender(e) {
      let props = this.properties;
      this.triggerEvent("gender", {
        gender: e.target.dataset.gender,
        inputType: props.inputType
      })
    },

    bindDel() {
      let props = this.properties;
      this.triggerEvent("del", {
        inputType: props.inputType,
        index: props.index,
        arrayType: props.arrayType
      })
    }
  }
})
