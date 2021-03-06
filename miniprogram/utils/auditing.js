const db = wx.cloud.database();
const _ = db.command;
const toast = require("./message").toast;
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const downloadList = async () => {
  wx.showLoading({
    title: "加载审核列表"
  })
  try {

    let cloudRes = await wx.cloud.callFunction({
      name: "auditing",
      data: {
        $url: "download",
      }
    })

    wx.hideLoading();
    toast("列表加载成功", "success");
    console.log("审核列表加载成功：", cloudRes.result.data);
    return cloudRes.result.data;

  } catch (error) {
    wx.hideLoading();
    toast("列表加载失败", "none");
    console.log("审核列表加载失败：", error.message);
  }
}

const allowAuditing = async (openidList) => {
  wx.showLoading({
    title: "提交数据中"
  })

  let res = await wx.cloud.callFunction({
    name: "auditing",
    data: {
      $url: "allow",
      openidList
    }
  });

  wx.hideLoading();

  if (res.result.code === 0) {
    toast("数据提交成功", "success");
    console.log("审核通过操作成功：", res.result);
  } else {
    toast("数据提交失败", "none");
    console.log("审核通过操作失败：", res.err);
  }

  return res.result;
}

const disallowAuditing = async (openidList) => {
  wx.showLoading({
    title: "提交数据中"
  })

  let res = await wx.cloud.callFunction({
    name: "auditing",
    data: {
      $url: "disallow",
      openidList
    }
  });

  wx.hideLoading();

  if (res.result.code === 0) {
    toast("数据提交成功", "success");
    console.log("审核驳回操作成功：", res.result);
  } else {
    toast("数据提交失败", "none");
    console.log("审核驳回操作失败：", res.err);
  }

  return res.result;
}

const downloadAuthCode = async () => {
  try {
    let authCodeList = []
    let downloadRes = await db.collection("auth-code").get();
    
    if (downloadRes.data) authCodeList = downloadRes.data;

    return authCodeList;

  } catch (error) {
    console.log(error.message);
  }
}

module.exports = {
  download: downloadList,
  allow: allowAuditing,
  disallow: disallowAuditing,
  downloadAuthCode,
}