const db = wx.cloud.database();
const toast = require("./message").toast;
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";


const downloadContact = async () => {
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
        data: res.data[0]
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

module.exports = {
  download: downloadContact
}