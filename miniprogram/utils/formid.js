const db = wx.cloud.database();
const toast = require("./message").toast;
const app = getApp();
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

module.exports = {
  getFormid: (formid) => {
    if (app.globalData.formidArray === undefined) {
      app.globalData.formidArray = [];
    }
    if (formid === "the formId is a mock one") return;
    app.globalData.formidArray.push(formid);
  },
  upload: async () => {
    if (app.globalData.formidArray === undefined) {
      app.globalData.formidArray = [];
      return;
    }
    let curFormidArray = app.globalData.formidArray, formidArray = [];
    if (curFormidArray.length !== 0) {
      curFormidArray.map(item => {
        formidArray.push({
          formid: item,
          timeout: db.serverDate({
            offset: 7*24*60*60*1000
          })
        })
      });
      let res = await db.collection("formid").where({
        _openid: wx.getStorageSync("openid")
      }).get();
      if (res.data.length === 0) {
        await db.collection("formid").add({
          data: {
            formidArray
          }
        });
      } else {
        formidArray = res.data[0].formidArray.concat(formidArray);
        app.globalData.formidArray = [];
        await db.collection("formid").doc(res.data[0]._id).update({
          data: {
            formidArray
          }
        });
      }
    }
  }
}