const db = wx.cloud.database();
const toast = require("./message").toast;
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const tmpDownload = async (arr, collection) => {
  let res = await Promise.all(arr.map(item => {
      return db.collection(collection).where({
        _openid: item._openid
      }).get()
  }))
  let final = [];
  res.map(item => final.push(item = item.data[0]));
  return final;
}

const downloadList = async () => {
  wx.showLoading({
    title: "加载审核列表"
  })
  try {
    let res = await db.collection("auth").where({
      status: "auditing"
    }).get();

    let finalArray = res.data;

    let combinedArray = await Promise.all([
      tmpDownload(finalArray, "avatar"),
      tmpDownload(finalArray, "profile")
    ])

    combinedArray[0].map(item1 => {
      delete item1.isCustom;
      combinedArray[1].map(item2 => {
        if (item1._openid === item2._openid) {
          item1.nickName = item2.nickName;
        }
      })
    });

    finalArray.map(item1 => {
      combinedArray[0].map(item2 => {
        if (item1._openid === item2._openid) {
          for (let attr in item2) {
            item1[attr] = item2[attr];
          }
        }
      })
    })

    wx.hideLoading();
    toast("列表加载成功");
    return finalArray;

  } catch (error) {
    wx.hideLoading();
    toast("列表加载失败", "none");
    console.log("审核列表加载失败：", error);
  }
}

module.exports = {
  download: downloadList
}