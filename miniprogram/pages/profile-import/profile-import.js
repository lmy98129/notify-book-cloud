// miniprogram/pages/profile-import/profile-import.js

const confirmOnly = require("../../utils/message").confirmOnly;
const toast = require("../../utils/message").toast;
const profModel = require("../../utils/profile-model");

import regeneratorRuntime, { async } from "../../utils/regenerator-runtime/runtime";

const db = wx.cloud.database();

const initKeysRange = () => {
  let { searchField } = profModel, keysRange = [], accordingRange = [],
    specialArrays = ["degreeArray", "jobArray", "contactArray"];
  let { searchColumnItem, searchColumnKey } = searchField.searchColumn;
  keysRange = keysRange.concat(searchColumnItem);
  accordingRange = accordingRange.concat(searchColumnKey);
  for (let item of specialArrays) {
    let tmpIndex = searchColumnKey.findIndex((x) => x===item);
    for (let subItem of searchField[item][item+"Item"]) {
      keysRange.push(searchColumnItem[tmpIndex] + "-" + subItem);
    }
    for (let subKey of searchField[item][item+"Key"]) {
      accordingRange.push(item + "-" + subKey);
    }
  }
  return { keysRange, accordingRange };
}

const normalizeGenerator = (accordingRange, normalize, value, normIndex) => {
  let according, content, isMultiKeys = false;
  if (accordingRange[value].split("-").length <= 1) {
    switch(accordingRange[value]) {
      case "degreeArray":
        according = ['degreeArray', 'degree'];
        isMultiKeys = true;
        break;
      case "jobArray":
        according = ['jobArray', 'job'];
        isMultiKeys = true;
        break;
      case "contactArray":
        according = ['contactArray', 'contactType', 'content'];
        content = "here";
        break;
      default:
        according = accordingRange[value];
        break;
    }
  } else {
    according = accordingRange[value].split("-");
    isMultiKeys = true;
  }
  if (isMultiKeys) {
    if (normalize[normIndex-1] && normalize[normIndex-1].content === "start"){
      content = "next";
    } else {
      content = "start";
    }
  }
  return { content, according };
}

const concatNormArray = (normalize, extraArray) => {
  for (let extra of extraArray) {
    if ( extra.according instanceof Array) {
      let tmpIndex = normalize.findIndex(x => x.according[0] === extra.according[0]);
      normalize.splice(tmpIndex + 1, 0, extra);
    } else {
      normalize.push(extra);
    }
  }
}

const normalizeJson = (json, normalize) => {
  let newJson = [];
  for (let item of json) {
    let newItem = {};
    for (let rule of normalize) {
      if (rule.according === undefined || item[rule.source] === undefined && rule.source !== "extra") {
        continue;
      }
      let source;
      if (rule.source === "extra") {
        source = rule.extraSource;
      } else {
        source = item[rule.source];
      }
      if (rule.content === undefined) {
        newItem[rule.according] = source;
      } else {
        if (newItem[rule.according[0]] === undefined) {
          newItem[rule.according[0]] = [];
        }
        switch(rule.content) {
          case "here":
            newItem[rule.according[0]].push({
              [rule.according[1]]: rule.source,
              [rule.according[2]]: source,
            })
            break;
          case "start":
            newItem[rule.according[0]].push({
              [rule.according[1]]: source
            })
            break;
          case "next":
            let tmpItem = newItem[rule.according[0]].pop();
            if (tmpItem === undefined) {
              newItem[rule.according[0]].push({
                [rule.according[1]]: source
              })
            } else {
              tmpItem[rule.according[1]] = source;
              newItem[rule.according[0]].push(tmpItem);
            }
            break;
        }
      }
    }
    newJson.push(newItem);
  }
  return newJson;
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

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isSelectDocumentModalHidden: true,
    isExtraKeyModalHidden: true,
    isDocumentUploaded: false,
    isSelectClassInfoModalHidden: true,
    isSelectedClassInfo: false,
    selectedClassInfo: {},
    selectedClassInfoForm: {},
    columnData: [],
    importDocuments: [],
    selectedDocument: "",
    sheetNames: [],
    selectedSheets: [],
    range: "",
    headerColumns: [],
    normalize: [],
    keysRange: [],
    extraKey: "请选择额外键值",
    selectedClassName: "请选择班级名称",
    extraKeyContent: "",
    extraKeys: [],
    preview: "",
    importData: [],
    classNameArray: [],
    classInfoArray: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    try {

      let { keysRange, accordingRange } = initKeysRange();
      this.setData({
        keysRange, accordingRange
      })
  
      let classInfoRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "classInfoDownload"
        }
      })
  
      if (classInfoRes.result) {
        let { classNameArray, data } = classInfoRes.result;
        classNameArray.sort(sortByNum).reverse();
        this.setData({ classNameArray, classInfoArray: data });
      }

    } catch (error) {
      console.log(error.message);
    }
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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

  upload: function () {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      success: async res => {
        try {
          wx.showLoading({
            title: "文件上传中"
          })
          const filePath = res.tempFiles[0].path;
          const fileName = res.tempFiles[0].name;
          if ([".xlsx", ".xls"].findIndex((x) => x.toLowerCase() === filePath.match(/\.[^.]+?$/)[0].toLowerCase()) < 0) {
            confirmOnly("文件格式不匹配");
            return;
          }
          const cloudPath = "import/" + (new Date()).getTime() + "-" + fileName;
          let uploadFileRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath,
          });
  
          let { fileID } = uploadFileRes;
  
          await db.collection("import-list").add({data: {
            document: fileID,
          }})
  
          let sheetNamesRes = await wx.cloud.callFunction({
            name: "profile-manage",
            data: {
              $url: "getExcelSheetNames",
              fileID
            }
          })
  
          let { sheetNames } = sheetNamesRes.result;

          this.setData({
            sheetNames,
            selectedDocument: fileID,
            isDocumentUploaded: true,
          })
          
          wx.hideLoading();
          console.log('上传文档成功：', uploadFileRes.result);
          toast("上传文档成功", "success");
        } catch (error) {
          wx.hideLoading();
          console.log(error);          
        }

      }
    })
  },

  useFile: async function() {
    try {
      wx.showLoading({
        title: "加载中"
      })
      let documentRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "getImportDocuments",
        }
      });
  
      if (documentRes.result) {
        let { data } = documentRes.result;
        let importDocuments = data.map((value, index) => {
          let { document } = value;
          return {
            document,
            name: document.match(/(.*\/)*([^.]+).*/)[2] + document.match(/\.[^.]+?$/)[0]
          };
        })
        this.setData({
          importDocuments,
          isSelectDocumentModalHidden: false,
        })
  
      } 
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.log(error);
    }

  },

  selectDocument(e) {
    let { value } = e.detail;
    this.setData({
      selectedDocument: value,
    })
  },

  hideSelectDocument() {
    this.setData({
      isSelectDocumentModalHidden: true,
      importDocuments: [],
      selectedDocument: "",
    })
  },

  selectDocumentNext: async function() {
    let { selectedDocument } = this.data;
    if (selectedDocument === "" || selectedDocument === undefined) {
      confirmOnly("请选择一个文件");
    } else {
      try {
        this.setData({
          isSelectDocumentModalHidden: true,
          importDocuments: [],
          isDocumentUploaded: true,
        })
  
        wx.showLoading({
          title: "加载中"
        })
  
        let fileID = selectedDocument;
        let sheetNamesRes = await wx.cloud.callFunction({
          name: "profile-manage",
          data: {
            $url: "getExcelSheetNames",
            fileID
          }
        })
  
        wx.hideLoading();

        let { sheetNames } = sheetNamesRes.result;

        this.setData({
          sheetNames
        })
  
      } catch (error) {
        wx.hideLoading();
        console.log(error);   
      }
      
    }
  },

  deleteDocument:async function (e) {
    try {
      let { index } = e.target.dataset;
      let { importDocuments } = this.data;
      wx.showLoading({
        title: "上传请求中",
      })

      let deleteRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "deleteImportDocuments",
          fileList: [importDocuments[index].document],
        }
      })
      
      wx.hideLoading()
      if (deleteRes.result.code === 1) {
        this.useFile(); 
      }
      
    } catch (error) {
      wx.hideLoading();
      console.log(error);
    }

  },

  modalTouchMove(e) {

  },

  selectSheet(e) {
    let { value } = e.detail;
    this.setData({
      selectedSheets: value,
    })
  },

  previewDocument: async function() {
    try {
      wx.showLoading({
        title: "文件加载中",
      });

      let { selectedDocument } = this.data;
      let tmpFileRes = await wx.cloud.downloadFile({
        fileID: selectedDocument
      });
      wx.hideLoading();

      wx.openDocument({
        filePath: tmpFileRes.tempFilePath,
      })
      
    } catch (error) {
      wx.hideLoading()
      console.log(error);
    }
    
  },

  setRange(e) {
    let { value } = e.detail;
    this.setData({
      range: value,
    })
  },

  getHeaderColumns: async function() {
    try {
      let { range, selectedSheets, selectedDocument } = this.data;
      let parseRange = range.match(/[a-zA-Z]/g);
      if (parseRange !== null && parseRange.length !== 2) {
        confirmOnly("有效范围无效，请按照格式填写");
        return;
      }
      wx.showLoading({
        title: "加载中"
      })
      let startCol = parseRange[0], endCol = parseRange[1], 
        row = range.match(/[0-9]+/ig)[0], sheetName = selectedSheets[0], fileID = selectedDocument;
      let columnsRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "getHeaderColumns",
          startCol, endCol, row, range, sheetName, fileID
        }
      })

      if (columnsRes.result !== undefined) {
        let { code } = columnsRes.result;
        switch(code) {
          case -1:
            confirmOnly("发生错误，请检查第③步填写的有效范围是否正确");
            break;
          case 1:
            let headerColumns = columnsRes.result.cols;
            let normalize = headerColumns.map((value) => {
              return { source: value, accordingName: "请选择对应的导入键值" }
            })
            this.setData({ normalize });
            break;
        }
      }

      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.log(error);
    }
  },

  pickerDel(e) {
    let { inputType } = e.detail;
    let { normalize } = this.data;
    let tmpIndex = (normalize.findIndex((x) => x.source === inputType));
    if (normalize[tmpIndex].according) {
      delete normalize[tmpIndex].according
    }
    if (normalize[tmpIndex].content) {
      delete normalize[tmpIndex].content
    }
    normalize[tmpIndex].accordingName = "请选择对应的导入键值";
    this.setData({
      normalize
    })
    
  },

  setKeys(e) {
    let { value, inputType } = e.detail;
    let { normalize, keysRange, accordingRange } = this.data;
    let normIndex = (normalize.findIndex((x) => x.source === inputType));
    normalize[normIndex].accordingName = keysRange[value];
    let { according, content } = normalizeGenerator(accordingRange, normalize, value, normIndex);
    normalize[normIndex].according = according;
    if (content !== undefined) {
      normalize[normIndex].content = content;
    } else if (normalize[normIndex].content) {
      delete normalize[normIndex].content;
    }
    this.setData({ normalize });
  },

  showExtraKeyModal() {
    this.setData({
      isExtraKeyModalHidden: false,
      extraKey: "请选择额外键值",
      extraKeyContent: "",
    })
  },

  hideExtraKeyModal() {
    this.setData({
      isExtraKeyModalHidden: true,
      extraKey: "请选择额外键值",
      extraKeyContent: "",
    })
  },

  showSelectClassInfoModal() {
    this.setData({
      isSelectClassInfoModalHidden: false,
      selectedClassName: "请选择班级名称"
    })
  },

  hideSelectClassInfoModal() {
    this.setData({
      isSelectClassInfoModalHidden: true,
      selectedClassName: "请选择班级名称"
    })
  },

  setClassInfo(e) {
    let { value } = e.detail;
    let { classNameArray, classInfoArray } = this.data;
    let selectedClassName = classNameArray[value];
    let tmpIndex = classInfoArray.findIndex(x => x.className === selectedClassName);
    let selectedClassInfo = classInfoArray[tmpIndex];
    delete selectedClassInfo._id;
    let selectedClassInfoForm = {}
    for (let subItem in selectedClassInfo) {
      selectedClassInfoForm[subItem] = {};
      selectedClassInfoForm[subItem].title = profModel.initValue[subItem].name;
      selectedClassInfoForm[subItem].content = selectedClassInfo[subItem];
    }
    this.setData({
      selectedClassName,
      selectedClassInfo,
      selectedClassInfoForm,
      isSelectedClassInfo: true,
    })
  },

  cancelSelectClassInfo() {
    this.setData({
      selectedClassName: "请选择班级名称",
      selectedClassInfo: {},
      selectedClassInfoForm: {},
      isSelectedClassInfo: false,
    })
  },

  addExtraKeys() {
    let { keysRange, accordingRange, extraKeys, extraKey, extraKeyContent, normalize } = this.data;
    if (extraKeyContent === undefined || extraKeyContent === "") {
      toast("请输入额外键值的内容", "none");
      return;
    }
    if (extraKey === undefined || extraKey === "请选择额外键值") {
      toast("请选择额外键值", "none");
      return;
    }
    let value = keysRange.findIndex((x) => x === extraKey);
    let normIndex = normalize.findIndex((x) => {
      if (x.according && x.according[0]) {
        return x.according[0] === accordingRange[value].split("-")[0];
      } else {
        return false;
      }
    });
    let tmpKey = { source: "extra" };
    let { according, content } = normalizeGenerator(accordingRange, normalize, value, normIndex+1);
    tmpKey.according = according;
    tmpKey.accordingName = extraKey;
    if (content !== undefined) {
      tmpKey.content = content;
    }
    if (extraKeyContent !== undefined && extraKeyContent !== "") {
      tmpKey.extraSource = extraKeyContent;
    }
    extraKeys.push(tmpKey);
    this.setData({
      extraKeys,
      isExtraKeyModalHidden: true,
      extraKey: "请选择额外键值",
      extraKeyContent: "",
    })
  },

  setExtraKey(e) {
    let { value } = e.detail;
    let { keysRange } = this.data;
    this.setData({
      extraKey: keysRange[value],
    })
  },

  setExtraKeyContent(e) {
    this.setData({
      extraKeyContent: e.detail.value,
    })
  },

  deleteExtraKey(e) {
    let { index } = e.target.dataset;
    let { extraKeys } = this.data;
    extraKeys.splice(index, 1);
    this.setData({
      extraKeys
    })
  },

  preview: async function() {
    try {
      wx.showLoading({
        title: "转换格式中",
      })
      let { normalize, extraKeys, range, 
        selectedSheets, selectedDocument, isSelectedClassInfo, selectedClassInfo } = this.data;
      concatNormArray(normalize, extraKeys);
      let jsonRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "getXLSXJson",
          range, 
          fileID: selectedDocument,
          selectedSheets,
        }
      });
  
      if (jsonRes.result) {
        let { json } = jsonRes.result;
        let preview = normalizeJson(json, normalize);
        for (let data of preview) {
          if (data.gender === "男") {
            data.gender = 1;
          } else if (data.gender === "女"){
            data.gender = 2;
          }
          if (isSelectedClassInfo) {
            if (data.degreeArray === undefined) {
              data.degreeArray = [];
            }
            data.degreeArray[0] = selectedClassInfo;
          }
        }
        let importData = preview;
        preview = JSON.stringify(preview);
        this.setData({
          preview,
          importData,
        })
      }
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.log(error);
    }
  },

  importData: async function() {
    try {
      let { importData } = this.data;
      if (importData.length && importData.length < 0) {
        confirmOnly("请先预览数据格式");
        return;
      }
      wx.showLoading({
        title: "上传中",
      })

      for (let data of importData) {
        data.isProfileEmpty = false;
        data.authStatus = "authorized";
      }

      let importRes = await wx.cloud.callFunction({
        name: "profile-manage",
        data: {
          $url: "importData",
          importData,
          collection: "profile"
        }
      });

      wx.hideLoading();

      if (importRes.result && importRes.result.code === 1) {
        toast("导入数据成功", "success");
      } else {
        toast("导入数据失败", "none");
      }
      
    } catch (error) {
      wx.hideLoading();
      toast("导入数据失败", "none");
      console.log(error);
    }
  },


})