// 云函数入口文件
const cloud = require('wx-server-sdk')

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
      return db.collection("user-message").add({
        data: {
          userOpenid: item,
          msgId: "W7ZAvQIrVDZJFsXO",
          status: "un-read",
          createTime: db.serverDate()
        }
      })
    }));

    return {
      code: 0,
      msg: "allowing succeed"
    }

  } catch(error) {
    console.log(error);
    return {
      code: -1,
      msg: "allowing failed",
      err: error
    }
  }
}