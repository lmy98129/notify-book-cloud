const db = wx.cloud.database();
const toast = require("./message").toast;
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";


const download = async () => {
  try {
    let res = await db.collection("user-contact").where({
      _openid: wx.getStorageSync("openid")
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
      return {
        code: 1,
        msg: "download contact record",
        data: res.data[0],
      }
    }

  } catch (error) {
    console.log("通讯录下载出错", error)
    return {
      code: -1,
      msg: "download contact failed"
    }
  }
}

const check = async (openid) => {
  try {
    let res = await download();
    let friendList = res.data.friendList
    if (friendList.length === 0) {
      return {
        code: 0,
        msg: "contact empty & sure to add friend"
      }
    } else {
      for (const item in friendList) {
        if (friendList[item] === openid) {
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
      msg: "check contact failed"
    }
  }
} 

const add = async (openid) => {
  try {
    let res = await download();
    let friendList = res.data.friendList, id = res.data._id;
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

const del = async (openidArray) => {
  try {
    let res = await download();
    let friendList = res.data.friendList, id = res.data._id;
    for(const item in friendList) {
      for (const subItem in openidArray) {
        if (friendList[item] === openidArray[subItem]) {
          friendList.splice(item, 1);
        }
      } 
    }
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