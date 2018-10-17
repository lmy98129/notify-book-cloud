// 云函数入口文件
const cloud = require('wx-server-sdk');
const request = require("request");

cloud.init()

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    let openidList = event.openidList;
    let res = await Promise.all(openidList.map(item => {
      return db.collection("auth").where({
        _openid: item
      }).get()
    }))

    let authList = [], newOpenidList = [], newIdList = [];
    res.map(item => authList.push(item.data[0]));

    authList.map(item => {
      if (item.status === "authorized") {
        authList.pop(item);
      } else {
        newOpenidList.push(item._openid);
        newIdList.push(item._id);
      }
    })

    await Promise.all(newIdList.map(item => {
      return db.collection("auth").doc(item).update({
        data: {
          status: "authorized"
        }
      })
    }));

    await Promise.all(newOpenidList.map(item => {
      return db.collection("user-notification").add({
        data: {
          userOpenid: item,
          msgId: "W7ZAvQIrVDZJFsXO",
          status: "un-read",
          createTime: db.serverDate()
        }
      })
    }));

    let myDate = new Date();
    myDate = new Date(myDate.setHours(myDate.getHours() + 8));
    let data = {
      "touser": "",
      "template_id": "PClhDQdJsQMWpqDjdzdR2zWsk87EAOA05kLRw9Oyagg",
      "form_id": "",
      "page": "pages/notification/notification",
      "data": {
        "keyword1": {
          "value": "审核通过",
          "color": "#173177"
        },
        "keyword2": {
          "value": "校友您好，您已通过校友认证审核，现在您可以使用本小程序的全部功能。",
          "color": "#173177"
        }
      }
    }

    res = await cloud.callFunction({
      name: "notification",
      data: {
        $url: "sendTemplateMessage",
        data,
        openidList: newOpenidList
      }
    });

    return res.result;

  } catch(error) {
    console.log(error);
    return {
      code: -1,
      msg: "allowing failed",
      err: error
    }
  }
}