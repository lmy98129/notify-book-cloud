const db = wx.cloud.database();
const toast = require("./message").toast;
const app = getApp();
import regeneratorRuntime from "./regenerator-runtime/runtime";

const checkAdmin = async () => {
  try {
    let res = await db.collection("admin-list").where({
      adminOpenId: app.globalData.openid
      // wx.getStorageSync("openid")
    }).get()
  
    if (res.data.length !== 0) {
      return Promise.resolve({
        code: 1,
        msg: "administrator",
        isAdmin: true
      })
    } else {
      return Promise.resolve({
        code: 0,
        msg: "normal user",
        isAdmin: false
      })
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

module.exports = {
  check: checkAdmin
}