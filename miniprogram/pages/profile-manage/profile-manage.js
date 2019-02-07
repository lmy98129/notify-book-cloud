// miniprogram/pages/profile-manage/profile-manage.js
const profMan = require("../../utils/profile-manage");
const toast = require("../../utils/message").toast;
const columnRank = require("../../utils/profile-model").columnRank;

import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

const convertCol = (selectedColumn, that) => {
  let rows = [];
  for (let column of columnRank) {
    if (selectedColumn.findIndex((sel) => sel === column.key) >= 0) {
      rows.push(column);
    }
  }
  that.setData({ rows });
}


Page({

  /**
   * 页面的初始数据
   */
  data: {
    start: 0,
    pageLength: 30,
    isSelectColumnModalHidden: true,
    columnInfo: [],
    bodyWidth: 0,
    columns: [],
    datas: [],
    rows: [],
    selColumns: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {

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
    this.download()
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

  download: async function() {
    wx.showLoading({
      title: "数据加载中"
    })
    let { start, pageLength } = this.data;
    let downloadRes = await profMan.download(start, pageLength);
    switch(downloadRes.code) {
      case 1:
        let datas = downloadRes.result;
        wx.setStorage({ key: "profileManageDataTmp", data: datas })
        this.setData({ datas });
        break;
      case -1:
        toast("加载资料数据出错", "none");
        break;
    }
    let selColumns = JSON.parse(JSON.stringify(columnRank));
    let tmpSelValue = []
    this.setData({ selColumns });
    for (let column of selColumns) {
      if (column.checked !== undefined && column.checked === true) {
        tmpSelValue.push(column.key);
      }
    }
    convertCol(tmpSelValue, this);
    this.calc_col_width();
    wx.hideLoading();
  },

  selectColumn(e) {
    let value = e.detail.value;
    convertCol(value, this);
    this.calc_col_width();
  },
  
  hideSelectColumn() {
    this.setData({
      isSelectColumnModalHidden: true
    })
  },

  showSelectColumn() {
    this.setData({
      isSelectColumnModalHidden: false
    })
  },
  /**
   * 以下代码改造自https://github.com/qwang1113/mini-program-table
   */
  calc_col_width() {
    this.setData({
      columnInfo: [],
      bodyWidth: 0,
    });
    if (this.data.datas[0] !== undefined) {
      let rows = this.data.rows;
      let { bodyWidth } = this.data;
      wx.createSelectorQuery().selectAll('#table-body > .body > .tr > .td > .content').boundingClientRect(rects => {
        let row_info = rects.slice(0, rows.length);
        let columnInfo = {};
        row_info.map((row, i) => {
          let width;
          switch(rows[i].key) {
            case "homeTown":
              width = 200;
              break;
            case "birthDate":
              width = 130;
              break;
            case "nickName":
              width = 130;
              break;
            default:
              width = this.get_str_length(rows[i].col) > row.width ? this.get_str_length(rows[i].col) : row.width;
              break;
          }
          columnInfo[rows[i].key] = width;
          bodyWidth += width;
        });
        bodyWidth += 180;
        this.setData({
          columnInfo,
          columns: Object.keys(columnInfo),
          bodyWidth
        });
        console.log(this.data.columnInfo);
      }).exec();
    }
  },
  /**
   * 根据内容返回单元格宽度
   * @param str 单元格数据
   */
  get_str_length(str) {
    var length = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charAt(i);
      if (/^[\u0000-\u00ff]$/.test(c)) {
        length += 0.8;
      }
      else {
        length += 1;
      }
    }
    return length * 30
  },

  prevProfile(e) {
    wx.navigateTo({
      url: "../profile/profile?mode=profileManageDataTmp&index="+e.target.dataset.index
    })
  },

  editProfile(e) {
    wx.navigateTo({
      url: "../profile-edit/profile-edit?mode=profileManageDataTmp&index="+e.target.dataset.index
    })
  },

  deleteProfile: function(e) {
    wx.showModal({
      title: "确认删除",
      content: "即将删除该用户的所有资料、相关文件以及认证信息。一旦执行成功，以上数据将不可恢复，请您谨慎操作！！！",
      confirmColor: "#f00",
      success: async (res) => {
        if (res.confirm) {
          await profMan.deleteProfile("profileManageDataTmp", e.target.dataset.index);
          this.download();
        }
      }
    })
  }

})