// components/profile-detail/profile-detail.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    profileData: {
      type: Object,
      default: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    userInfo: [],
    degreeArray: [],
    contactArray: [],
    jobArray: [],
  },

  /**
   * 组件的方法列表
   */
  methods: {

  },

  observers: {
    "profileData": function(profileData) {
      this.setData(profileData);
    }
  },

})
