const app = getApp();
const toast = require("./message").toast;

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

let { DEFAULT_AVATARURL, DEFAULT_BGIMGURL } = app.globalData;

const download = async (start, pageLength, searchFieldArray) => {
  try {
    let query;
    if (searchFieldArray === undefined || searchFieldArray.length <= 0) {
      query = "ALL";
    } else {
      query = {};
      for (let field of searchFieldArray) {
        let { colKey, colItemKey, searchContent } = field;
        switch(colKey) {
          case "gender":
            query[colKey] = gender;
            break;
          case "nickName":
          case "realName":
          case "homeTown":
          case "address":
          case "phoneNumber":
          case "wechatId":
            query[colKey] = {
              $regex: searchContent, 
              $options: 'im',
            }
            break;
          case "birthDate":

            query[colKey] = {
              $gte: startTime,
              $lte: endTime
            }
            if (startTime === "请选择起始时间") {
              delete query[colKey].$gte
            }
            if (endTime === "请选择结束时间") {
              delete query[colKey].$lte
            }
            break;
          case "degreeArray":
            // if (query[colKey] === undefined) {
            //   query[colKey] = {
            //     $elemMatch: {}
            //   };
            // }
            switch(colItemKey) {
              case "degree":
                if (degree === "请选择学历") {
                  toast("请填写检索内容", "none");
                  return;
                }
                // query[colKey].$elemMatch[colItemKey] = degree;
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
                // query[colKey].$elemMatch[colItemKey] = {
                //   $regex: searchContent, 
                //   $options: 'im',
                // };
                break;
              case "degreeStartTime":
              case "degreeEndTime":
                if (startTime === "请选择起始时间" && endTime === "请选择结束时间") {
                  toast("请至少填写一个时间", "none");
                  return;
                }
                // query[colKey].$elemMatch[colItemKey] = {
                //   $gte: startTime,
                //   $lte: endTime
                // }
                // if (startTime === "请选择起始时间") {
                //   delete query[colKey].$elemMatch[colItemKey].$gte
                // }
                // if (endTime === "请选择结束时间") {
                //   delete query[colKey].$elemMatch[colItemKey].$lte
                // }
                searchContent = startTime + "~" + endTime;
                break;
            }
            break;
          case "contactArray":
            // if (query[colKey] === undefined) {
            //   query[colKey] = {
            //     $elemMatch: {}
            //   };
            // }
            switch(colItemKey) {
              case "contactType":
              case "content":
                if (searchContent === "" || searchContent === undefined) {
                  toast("请填写检索内容", "none");
                  return;
                }
                // query[colKey].$elemMatch[colItemKey] = {
                //   $regex: searchContent, 
                //   $options: 'im',
                // };
                break;
            }
            break;
          case "jobArray":
            // if (query[colKey] === undefined) {
            //   query[colKey] = {
            //     $elemMatch: {}
            //   };
            // }
            switch(colItemKey) {
              case "institution":
              case "job":
                if (searchContent === "" || searchContent === undefined) {
                  toast("请填写检索内容", "none");
                  return;
                }
                // query[colKey].$elemMatch[colItemKey] = {
                //   $regex: searchContent, 
                //   $options: 'im',
                // };
                break;
              case "jobStartTime":
              case "jobEndTime":
                if (startTime === "请选择起始时间" && endTime === "请选择结束时间") {
                  toast("请至少填写一个时间", "none");
                  return;
                }
                // query[colKey].$elemMatch[colItemKey] = {
                //   $gte: startTime,
                //   $lte: endTime
                // };
                // if (startTime === "请选择起始时间") {
                //   delete query[colKey].$elemMatch[colItemKey].$gte
                // }
                // if (endTime === "请选择结束时间") {
                //   delete query[colKey].$elemMatch[colItemKey].$lte
                // }
                searchContent = startTime + "~" + endTime;
                break;
            }
            break;
        }
      }
    }
    let manageRes = await wx.cloud.callFunction({
      name: "search",
      data: {
        $url: "manage",
        collection: "profile-test",
        query,
        start,
        pageLength,
      }
    });
    
    if (manageRes.result !== undefined) {
      switch(manageRes.result.code) {
        case 1:
          let { result } = manageRes;
          let { searchRes, start, total } = result;
          return {
            code: 1,
            result: searchRes,
            start,
            total,
          }
          break;
        case -1:
          return {
            code: -1,
            err: manageRes.result.err
          }
          break;
      }
    } else {
      return {
        code: -1
      }
    }
    
  } catch (error) {
    console.log(error);
    return {
      code: -1,
      err: error.message
    }
  }
}

const deleteProfile = async (mode, index) => {
  try {
    wx.showLoading({
      title: "删除用户资料中",
    });

    let profiles = wx.getStorageSync(mode);
    let { _id, avatarUrl, bgImgUrl, authImgUrl } = profiles[index];

    await wx.cloud.callFunction({
      name: "profile-manage",
      data: {
        $url: "deleteProfile",
        _id,
        collection: "profile-test",
      }
    })

    let fileList = [];

    if (avatarUrl !== undefined && avatarUrl !== "" 
    && avatarUrl !== DEFAULT_AVATARURL) {
      fileList.push(avatarUrl)
    }

    if (bgImgUrl !== undefined && bgImgUrl !== "" 
    && bgImgUrl !== DEFAULT_BGIMGURL) {
      fileList.push(bgImgUrl)
    }

    if (authImgUrl !== undefined && authImgUrl.length !== undefined 
    && authImgUrl.length > 0) {
      fileList.concat(authImgUrl)
    }

    let deleteRes = await wx.cloud.deleteFile({
      fileList
    })

    wx.hideLoading();
    console.log("删除用户资料成功", deleteRes);
  } catch (error) {
    wx.hideLoading();
    console.log("删除用户资料失败", error.message);
    toast("删除用户资料失败", "none");
  }
}

module.exports = {
  download,
  deleteProfile
}