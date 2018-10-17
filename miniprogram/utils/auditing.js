const db = wx.cloud.database();
const _ = db.command;
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
      status: _.eq("auditing").or(_.eq("authorized"))
    }).get();

    let finalArray = res.data;
    let avatarArray = await tmpDownload(finalArray, "avatar");
    let profileArray = await tmpDownload(finalArray, "profile");

    avatarArray.map(item1 => {
      delete item1.isCustom;
      profileArray.map(item2 => {
        if (item1._openid === item2._openid) {
          item1.nickName = item2.nickName;
        }
      })
    });

    finalArray.map(item1 => {
      avatarArray.map(item2 => {
        if (item1._openid === item2._openid) {
          for (let attr in item2) {
            item1[attr] = item2[attr];
          }
        }
      })
    })

    wx.hideLoading();
    toast("列表加载成功");
    console.log("审核列表加载成功：", finalArray);
    return finalArray;

  } catch (error) {
    wx.hideLoading();
    toast("列表加载失败", "none");
    console.log("审核列表加载失败：", error);
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

  console.log(res);

  if (res.result.code === 0) {
    toast("数据提交成功");
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

  console.log(res);
  wx.hideLoading();

  if (res.result.code === 0) {
    toast("数据提交成功");
    console.log("审核驳回操作成功：", res.result);
  } else {
    toast("数据提交失败", "none");
    console.log("审核驳回操作失败：", res.err);
  }

  return res.result;
}

module.exports = {
  download: downloadList,
  allow: allowAuditing,
  disallow: disallowAuditing,
}