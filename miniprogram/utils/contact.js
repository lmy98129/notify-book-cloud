const db = wx.cloud.database();
const toast = require("./message").toast;
const app = getApp();
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";


const download = async () => {
  try {
    let res = await db.collection("user-contact").where({
      _openid: app.globalData.openid
      // wx.getStorageSync("openid")
    }).get();
    
    if (res.data.length === 0) {
      await db.collection("user-contact").add({
        data: {
          friendList: []
        }
      });
      
      return {
        code: 0,
        msg: "new contact record added"
      }
    } else {
      let result = [], openidArray = res.data[0].friendList, id = res.data[0]._id,
        friendList = JSON.stringify(openidArray);
      for (let i=0; i<openidArray.length; i++ ) {
        res = await db.collection("profile-new").where({
          _openid: openidArray[i],
          isUserProfileEmpty: false,
          authStatus: "authorized",
        }).get();
        if (res.data !== undefined && res.data.length > 0) {
          result.push(res.data[0]);
        }
      }

      return {
        code: 1,
        msg: "download contact record",
        data: result,
        friendList,
        id,
      }
    }

  } catch (error) {
    console.log("通讯录下载出错", error)
    return {
      code: -1,
      msg: "download contact failed",
      error
    }
  }
}

const check = async (openid) => {
  try {
    let res = await download();
    let friendList = res.data
    if (friendList.length === 0) {
      return {
        code: 0,
        msg: "contact empty & sure to add friend"
      }
    } else {
      for (const item in friendList) {
        if (friendList[item]._openid === openid) {
          return {
            code: 1,
            msg: "friend has been added"
          }
        }
      }
      return {
        code: 0,
        msg: "friend can be added"
      }
    }
  } catch (error) {
    console.log("好友检测出错", error)
    return {
      code: -1,
      msg: "check contact failed",
      error
    }
  }
} 

const add = async (openid) => {
  try {
    let res = await download();
    let friendList = JSON.parse(res.friendList), id = res.id;
    friendList.push(openid);
    res = await db.collection("user-contact").doc(id).update({
      data: {
        friendList
      }
    });
    return {
      code: 0,
      msg: "add friend succeed"
    }
  } catch (error) {
    console.log("添加好友出错", error)
    return {
      code: -1,
      msg: "add friend failed",
      error
    }
  }
}

const del = async (openid) => {
  try {
    let res = await download();
    let friendList = JSON.parse(res.friendList), id = res.id;
    for(let i=0; i<friendList.length; i++) {
      for (let j=0; j<openid.length; j++) {
        if (friendList[i] === openid[j]) {
          friendList.splice(i, 1);
        }
      } 
    }

    console.log(friendList);
    res = await db.collection("user-contact").doc(id).update({
      data: {
        friendList
      }
    });
    return {
      code: 0,
      msg: "del friend succeed"
    }
  } catch (error) {
    console.log("删除好友出错", error)
    return {
      code: -1,
      msg: "del friend failed",
      error
    }
  }
}

module.exports = {
  download,
  check,
  add,
  del
}