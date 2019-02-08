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
    scrollViewTop: 0,
    scrollViewLeft: 0,
    isSelectColumnModalHidden: true,
    isPageControlModalHidden: true,
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
    let { start, pageLength } = this.data;
    this.download(start, pageLength);
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

  download: async function(start, pageLength) {
    wx.showLoading({
      title: "数据加载中"
    })
    let downloadRes = await profMan.download(start, pageLength);
    switch(downloadRes.code) {
      case 1:
        let datas = downloadRes.result;
        let { total } = downloadRes;
        wx.setStorage({ key: "profileManageDataTmp", data: datas });
        let page = Math.ceil(start / pageLength) + 1;
        let totalPage = Math.ceil(total / pageLength);
        this.setData({ datas, page, totalPage, total });
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
          let { start, pageLength } = this.data;
          this.download(start, pageLength);
        }
      }
    })
  },

  prevPage() {
    let { start, pageLength } = this.data;
    if (start <= 0) {
      toast("当前已经是第一页", "none");
      return;
    } else {
      start -= pageLength;
      this.setData({ start });
      this.download(start, pageLength);
      wx.pageScrollTo({
        scrollTop: 0
      });
      this.setData({
        scrollViewTop: 0,
        scrollViewLeft: 0,
      });
    }
  },

  nextPage() {
    let { start, pageLength, total } = this.data;
    start += pageLength;
    if (start > total) {
      toast("当前已经是最后一页", "none");
      return;
    } else {
      this.setData({ start });
      this.download(start, pageLength);
      wx.pageScrollTo({
        scrollTop: 0
      });
      this.setData({
        scrollViewTop: 0,
        scrollViewLeft: 0,
      });
    }
  },

  showPageControl() {
    let { page, pageLength, total } = this.data;
    this.setData({
      isPageControlModalHidden: false,
      tmpPage: page,
      tmpPageLength: pageLength,
      tmpTotalPage: Math.ceil(total / pageLength)
    })
  },

  hidePageControl() {
    this.setData({
      isPageControlModalHidden: true
    })
  },

  pageControl() {
    let { tmpPage, tmpPageLength, total, page, pageLength } = this.data;
    if (tmpPage == "" || tmpPageLength == "" || 
      tmpPage <= 0 || tmpPageLength <= 0 || 
      tmpPage === null || tmpPageLength === null || 
      tmpPage === undefined || tmpPageLength === undefined ||
      isNaN(tmpPage) || isNaN(tmpPageLength)) {
      toast("输入格式有误，请重新输入或取消", "none");
      return;
    } else if (tmpPage > Math.ceil(total / tmpPageLength) ||
    tmpPageLength > total ) {
      toast("输入超出范围，请重新输入或取消", "none");
      return;
    } else if (tmpPage === page && tmpPageLength === pageLength) {
      this.setData({
        isPageControlModalHidden: true
      })
      return;
    } else {
      this.download((tmpPage-1)*tmpPageLength, tmpPageLength);
      this.setData({
        start: (tmpPage-1)*tmpPageLength,
        page: tmpPage,
        pageLength: tmpPageLength,
        isPageControlModalHidden: true
      })
    }
  },

  setPage(e) {
    let { value } = e.detail;
    this.setData({
      tmpPage: parseInt(value),
    })
  },

  setPageLength(e) {
    let { value } = e.detail;
    let { total } = this.data;
    let tmpPageLength = parseInt(value);
    this.setData({
      tmpPageLength
    })
    if (tmpPageLength > 0 && tmpPageLength !== null && 
      tmpPageLength !== undefined && !isNaN(tmpPageLength)) {
      this.setData({
      tmpTotalPage: Math.ceil(total / tmpPageLength)
      })
    }
  },

})