// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    let openidList = event.openidList, idList = [], imgUrlList = [];
    let res = await Promise.all(openidList.map(item => {
      return db.collection("auth").where({
        _openid: item
      }).get()
    }))

    res.map(item1 => {
      idList.push(item1.data[0]._id)
      item1.data[0].authImgUrl.map(item2 => imgUrlList.push(item2));
    });

    await Promise.all(idList.map(item => {
      return db.collection("auth").doc(item).update({
        data: {
          status: "unauthorized",
          authImgUrl: [],
          isCode: false,
          remark: ""
        }
      })
    }));

    await cloud.deleteFile({
      fileList: imgUrlList
    });

    await Promise.all(openidList.map(item => {
      return db.collection("user-notification").add({
        data: {
          userOpenid: item,
          msgId: "W7ZFZA6qgQy38id8",
          status: "un-read",
          createTime: db.serverDate()
        }
      })
    }));

    return {
      code: 0,
      msg: "disallowing succeed"
    }

  } catch (error) {
    return {
      code: -1,
      msg: "disallowing failed",
      err: error
    }
  }
}