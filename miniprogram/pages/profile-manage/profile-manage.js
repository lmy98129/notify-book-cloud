// miniprogram/pages/profile-manage/profile-manage.js
const profMan = require("../../utils/profile-manage");
const toast = require("../../utils/message").toast;
const modal = require("../../utils/message").modal;
const confirmOnly = require("../../utils/message").confirmOnly;
const columnRank = require("../../utils/profile-model").columnRank;
const searchField = require("../../utils/profile-model").searchField;

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
    isAddSearchFieldModalHidden: true,
    isSelColumnInit: true,
    searchColumnArray: searchField.searchColumn.searchColumnItem,
    selectedSearchColumnName: "请选择检索列项",
    selectedSearchColumnKey: "",
    selectedSearchColumnItemName: "请选择检索子项",
    startTimeForm: "请选择起始时间",
    endTimeForm: "请选择结束时间",
    startTime: "",
    endTime: "",
    searchContent: "",
    degreeTypeArray: ["本科", "硕士", "博士", "博士后", "专科", "其他"],
    degreeForm: "请选择学历",
    degree: "",
    searchTypeName: "",
    searchType: "",
    gender: 1,
    columnInfo: [],
    bodyWidth: 0,
    columns: [],
    datas: [],
    rows: [],
    selColumns: [],
    searchFieldArray: [],
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
    let { searchFieldArray, isSelColumnInit, selColumns } = this.data;
    let downloadRes = await profMan.download(start, pageLength, searchFieldArray);
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
    if (isSelColumnInit) {
      selColumns = JSON.parse(JSON.stringify(columnRank));
      this.setData({
        selColumns,
        isSelColumnInit: false,
      })
      let tmpSelValue = []
      for (let column of selColumns) {
        if (column.checked !== undefined && column.checked === true) {
          tmpSelValue.push(column.key);
        }
      }
      convertCol(tmpSelValue, this);
    }
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
          this.download(start, pageLength );
        }
      }
    })
  },

  prevPage(tmpStart) {
    let { start, pageLength } = this.data;
    if (start <= 0) {
      toast("当前已经是第一页", "none");
      return;
    } else {
      if (tmpStart !== undefined && typeof tmpStart !== "object") {
        start = tmpStart;
      } else {
        start -= pageLength;
      }
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

  firstPage() {
    this.prevPage(0);
  },

  lastPage() {
    let { totalPage, pageLength } = this.data;
    this.nextPage((totalPage-1)*pageLength);
  },

  nextPage(tmpStart) {
    let { start, pageLength, totalPage } = this.data;
    if (start >= (totalPage-1)*pageLength) {
      toast("当前已经是最后一页", "none");
      return;
    } else {
      if (tmpStart !== undefined && typeof tmpStart !== "object") {
        start = tmpStart;
      } else {
        start += pageLength;
      }
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

  addProfile() {
    wx.navigateTo({
      url: "../profile-edit/profile-edit?mode=addProfileManage"
    })
  },

  import: function() {
    wx.navigateTo({
      url: '../profile-import/profile-import',
    })
  },

  showAddSearchField() {
    this.setData({
      isAddSearchFieldModalHidden: false
    })
  },

  hideAddSearchField() {
    this.setData({
      isAddSearchFieldModalHidden: true,
      selectedSearchColumnName: "请选择检索列项",
      selectedSearchColumnKey: "",
      selectedSearchColumnItemName: "请选择检索子项",
      selectedSearchColumnItemKey: "",
      startTimeForm: "请选择起始时间",
      endTimeForm: "请选择结束时间",
      degreeForm: "请选择学历",
      degree: "",
      startTime: "",
      endTime: "",
      searchContent: "",
      searchType: "",
      searchTypeName: "",
    })
  },

  setSearchColumn(e) {
    let { value } = e.detail;
    let { searchColumnArray } = this.data;
    let selectedSearchColumnKey = searchField.searchColumn.searchColumnKey[value];
    this.setData({
      selectedSearchColumnName: searchColumnArray[value],
      selectedSearchColumnKey,
      selectedSearchColumnItemName: "请选择检索子项",
      selectedSearchColumnItemKey: "",
      startTimeForm: "请选择起始时间",
      endTimeForm: "请选择结束时间",
      degreeForm: "请选择学历",
      degree: "",
      startTime: "",
      endTime: "",
      searchContent: "",
      searchType: "",
      searchTypeName: "",
    })
    if (selectedSearchColumnKey === 'jobArray' || 
    selectedSearchColumnKey === 'contactArray' || 
    selectedSearchColumnKey === 'degreeArray') {
      let searchColumnItemArray = searchField[selectedSearchColumnKey][selectedSearchColumnKey+"Item"];
      this.setData({
        searchColumnItemArray
      })
    }
    switch(selectedSearchColumnKey) {
      case "gender":
        this.setData({
          searchTypeName: "等于",
          searchType: "equal"
        });
        break;
      case "nickName":
      case "realName":
      case "homeTown":
      case "address":
      case "phoneNumber":
      case "wechatId":
        this.setData({
          searchTypeName: "包含",
          searchType: "contain"
        });
        break;
      case "birthDate":
        this.setData({
          searchTypeName: "范围为",
          searchType: "range"
        });
        break;
    }
  },

  setSearchColumnItem(e) {
    let { value } = e.detail;
    let { searchColumnItemArray, selectedSearchColumnKey } = this.data;
    let selectedSearchColumnItemKey = searchField[selectedSearchColumnKey][selectedSearchColumnKey+"Key"][value];
    this.setData({
      selectedSearchColumnItemName: searchColumnItemArray[value],
      selectedSearchColumnItemKey,
      startTimeForm: "请选择起始时间",
      endTimeForm: "请选择结束时间",
      degreeForm: "请选择学历",
      degree: "",
      startTime: "",
      endTime: "",
      searchContent: "",
      searchType: "",
      searchTypeName: "",
    })
    switch(selectedSearchColumnItemKey) {
      case "degree":
        this.setData({
          searchTypeName: "等于",
          searchType: "equal"
        });
        break;
      case "school":
      case "major":
      case "className":
      case "headteacher":
      case "contactType":
      case "content":
      case "institution":
      case "job":
        this.setData({
          searchTypeName: "包含",
          searchType: "contain",
        });
        break;
      case "degreeStartTime":
      case "degreeEndTime":
      case "jobStartTime":
      case "jobEndTime":
        this.setData({
          searchTypeName: "范围为",
          searchType: "range"
        });
        break;
    }
  },

  getGender(e) {
    let { gender } = e.detail;
    this.setData({
      gender: parseInt(gender)
    })
  },

  setTime(e) {
    let { inputType, value } = e.detail;
    let formated = value.split("-");
    if (formated.length <= 2) {
      this.setData({
        [inputType + "Form"]: parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月",
        [inputType]: value
      })
    } else {
      this.setData({
        [inputType + "Form"]: parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月" + parseInt(formated[2]) + "日",
        [inputType]: value
      })
    }
  },

  setDegree(e) {
    let { inputType, value } = e.detail;
    let { degreeTypeArray } = this.data;
    this.setData({
      [inputType + "Form"]: degreeTypeArray[value],
      [inputType]: degreeTypeArray[value]
    });
  },

  pickerDel(e) {
    let { inputType } = e.detail;
    switch(inputType) {
      case "degree":
        this.setData({
          [inputType + "Form"]: "请选择学历",
          [inputType]: ""
        })
        break;
      case "startTime":
        this.setData({
          [inputType + "Form"]: "请选择起始时间",
          [inputType]: ""
        })
        break;
      case "endTime":
        this.setData({
          [inputType + "Form"]: "请选择结束时间",
          [inputType]: ""
        })
        break;
    }
  },

  setSearchContent(e) {
    let { value } = e.detail;
    this.setData({
      searchContent: value,
    })
  },

  addSearchField: async function() {
    let { selectedSearchColumnKey, selectedSearchColumnItemKey, 
      selectedSearchColumnName, selectedSearchColumnItemName,
      startTime, endTime, degree, gender, searchContent, searchTypeName, searchType, searchFieldArray } = this.data;
    let colKey = selectedSearchColumnKey, colItemKey = selectedSearchColumnItemKey,
      colName = selectedSearchColumnName, colItemName = selectedSearchColumnItemName,
      isOverride = false, searchFieldObj = {}, formated, searchContentFormated = "", overrideIndex;
    if (colKey === "" || colKey === undefined) {
      toast("请选择检索内容", "none");
      return;      
    }
    switch(colKey) {
      case "gender":
        if (gender === 1) {
          searchContent = "男";
        } else {
          searchContent = "女";
        }
        break;
      case "nickName":
      case "realName":
      case "homeTown":
      case "address":
      case "phoneNumber":
      case "wechatId":
        if (searchContent === "" || searchContent === undefined) {
          toast("请填写检索内容", "none");
          return;
        }
        break;
      case "birthDate":
        if (startTime === "" && endTime === "") {
          toast("请至少填写一个时间", "none");
          return;
        }
        searchContent = startTime + "~" + endTime;
        if (startTime !== "") {
          formated = startTime.split("-");
          searchContentFormated += parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月" + parseInt(formated[2]) + "日";
        }
        searchContentFormated += "~";
        if (endTime !== "") {
          formated = endTime.split("-");
          searchContentFormated += parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月" + parseInt(formated[2]) + "日";
        }
        break;
      case "degreeArray":
        switch(colItemKey) {
          case "degree":
            if (degree === "请选择学历") {
              toast("请填写检索内容", "none");
              return;
            }
            searchContent = degree;
            break;
          case "school":
          case "major":
          case "className":
          case "headteacher":
            if (searchContent === "" || searchContent === undefined) {
              toast("请填写检索内容", "none");
              return;
            }
            break;
          case "degreeStartTime":
          case "degreeEndTime":
            if (startTime === "" && endTime === "") {
              toast("请至少填写一个时间", "none");
              return;
            }
            searchContent = startTime + "~" + endTime;
            if (startTime !== "") {
              formated = startTime.split("-");
              searchContentFormated += parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
            }
            searchContentFormated += "~";
            if (endTime !== "") {
              formated = endTime.split("-");
              searchContentFormated += parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
            }
            break;
        }
        break;
      case "contactArray":
        switch(colItemKey) {
          case "contactType":
          case "content":
            if (searchContent === "" || searchContent === undefined) {
              toast("请填写检索内容", "none");
              return;
            }
            break;
        }
        break;
      case "jobArray":
        switch(colItemKey) {
          case "institution":
          case "job":
            if (searchContent === "" || searchContent === undefined) {
              toast("请填写检索内容", "none");
              return;
            }
            break;
          case "jobStartTime":
          case "jobEndTime":
            if (startTime === "" && endTime === "") {
              toast("请至少填写一个时间", "none");
              return;
            }
            searchContent = startTime + "~" + endTime;
            if (startTime !== "") {
              formated = startTime.split("-");
              searchContentFormated += parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
            }
            searchContentFormated += "~";
            if (endTime !== "") {
              formated = endTime.split("-");
              searchContentFormated += parseInt(formated[0]) + "年" + parseInt(formated[1]) + "月";
            }
            break;
        }
        break;
    }
    if (colKey === 'jobArray' || 
      colKey === 'contactArray' || 
      colKey === 'degreeArray') {
      searchFieldObj = { colKey, colItemKey, searchType, searchTypeName,  searchContent, colName, colItemName };
      overrideIndex = searchFieldArray.findIndex((x) => (x.colKey === colKey && x.colItemKey === colItemKey));
      if (overrideIndex >= 0) {
        let modalRes = await modal("检索条件列表中已有相同种类项目，若点击确定，则当前检索条件将覆盖同类项目");
        if (modalRes.confirm) {
          isOverride = true;
          overrideIndex
        } else if (modalRes.cancel) {
          return;
        }
      }
    } else {
      searchFieldObj = { colKey, searchType, searchTypeName, searchContent, colName };
      overrideIndex = searchFieldArray.findIndex((x) => (x.colKey === colKey));
      if (overrideIndex >= 0) {
        let modalRes = await modal("检索条件列表中已有相同种类项目，若点击确定，则当前检索条件将覆盖同类项目");
        if (modalRes.confirm) {
          isOverride = true;
        } else if (modalRes.cancel) {
          return;
        }
      }
    }
    if (searchContentFormated !== undefined) {
      searchFieldObj.searchContentFormated = searchContentFormated;
    }
    if (!isOverride) {
      searchFieldArray.push(searchFieldObj);
    } else if (isOverride && overrideIndex >= 0){
      searchFieldArray.splice(overrideIndex, 1);
      searchFieldArray.splice(overrideIndex, 0, searchFieldObj);
    }
    this.setData({ searchFieldArray });
    this.hideAddSearchField();
  },

  deleteSearchField(e) {
    let { index } = e.target.dataset;
    let { searchFieldArray } = this.data;
    searchFieldArray.splice(index, 1);
    this.setData({ searchFieldArray });
    if (searchFieldArray.length == 0) {
      let { start, pageLength } = this.data;
      this.download(start, pageLength);
    }
  },

  startSearch: async function() {
    let { start, pageLength } = this.data;
    this.download(start, pageLength);
  },

  modalTouchMove(e) {

  },

  export: async function() {
    try {
      let modalRes = await modal("即将导出当前检索条件下得出的全部资料，导出格式为xlsx，导出成功后将自动打开文件，您可以点击右上角将文件转发到微信的文件传输助手中，以保存导出的xlsx文件");
      if (modalRes.cancel) {
        return;
      }
      wx.showLoading({
        title: "导出中"
      })
      let { rows, searchFieldArray, total } = this.data;
      let downloadRes = await profMan.download(0, total, searchFieldArray);
      if (downloadRes.code === 1) {
        let keys = [], exportDatas = [], tmpIndex, datas = downloadRes.result,
          totalKeys = [];        
        for (let row of rows) {
          keys.push(row.key);
        }
        for (let data of datas) {
          let tmpData = {}
          for (let key of keys) {
            if (data[key] instanceof Array) {
              for (let i in data[key]) {
                for (let subKey in data[key][i]) {
                  tmpIndex = searchField[key][key+"Key"].findIndex(x => x === subKey);
                  if (data[key][i][subKey]) {
                    tmpData[searchField[key][key+"Item"][tmpIndex] + "-" + (parseInt(i)+1)] = data[key][i][subKey];
                  } else {
                    tmpData[searchField[key][key+"Item"][tmpIndex] + "-" + (parseInt(i)+1)] = "";
                  }
                }
              }
            } else {
              tmpIndex = searchField.searchColumn.searchColumnKey.findIndex(x => x === key);
              if (data[key]) {
                tmpData[searchField.searchColumn.searchColumnItem[tmpIndex]] = data[key];
              } else {
                tmpData[searchField.searchColumn.searchColumnItem[tmpIndex]] = "";
              }
            }
          }
          exportDatas.push(tmpData);
        }
        for (let data of exportDatas) {
          for (let key in data) {
            if (totalKeys.indexOf(key) < 0) {
              totalKeys.push(key);
            }
          }
        }
        for (let data of exportDatas) {
          for (let key of totalKeys) {
            if (data[key] === undefined) {
              data[key] = "";
            }
          }
        }
        const sortByNum = (x, y) => {
          let xNum = x.match(/[0-9]+/ig);
          let yNum = y.match(/[0-9]+/ig);
          if (xNum !== null && yNum !== null) {
            return parseInt(xNum[0]) - parseFloat(yNum[0]);
          } else if (xNum === null && xNum === null ) {
            return 0;
          } else {
            console.log(x, y);
            return xNum == null ? -1 : 1; 
          }
        }
        
        let notNums = totalKeys.filter((value) => {
          return !/[0-9]+/ig.test(value);
        })
        
        let hasNums = totalKeys.filter((value) => {
          return /[0-9]+/ig.test(value);
        })

        let header = notNums.concat(hasNums.sort(sortByNum));

        let exportRes = await wx.cloud.callFunction({
          name: "profile-manage",
          data: {
            $url: "exportData",
            json: exportDatas,
            header,
          }
        })

        if (exportRes.result.code === 1) {
          let { fileID } = exportRes.result;
          console.log("导出成功", fileID);
          wx.hideLoading();
          toast("导出成功", "success");
          let tmpFileRes = await wx.cloud.downloadFile({
            fileID,
          });
          wx.openDocument({
            filePath: tmpFileRes.tempFilePath,
          })
        }
      } else {
        wx.hideLoading();
        toast("导出失败", "none");
      }
    } catch (error) {
      wx.hideLoading();
      toast("导出失败", "none");
      console.log(error);
    }
  }

})