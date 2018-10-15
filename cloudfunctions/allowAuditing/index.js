// 云函数入口文件
const cloud = require('wx-server-sdk');
const request = require("request");

cloud.init()

const db = cloud.database();
const _ = db.command;
const messageUrl = "https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token="

const apiReq = (url, body) => new Promise((resolve, reject) => {
  request({url, method: "POST", json: true, body}, (err, res, body) => {
    if (err) {
      reject(err);
    } else {
      resolve(body);
    }
  })
})

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


    // await Promise.all(newIdList.map(item => {
    //   return db.collection("auth").doc(item).update({
    //     data: {
    //       status: "authorized"
    //     }
    //   })
    // }));

    // await Promise.all(newOpenidList.map(item => {
    //   return db.collection("user-notification").add({
    //     data: {
    //       userOpenid: item,
    //       msgId: "W7ZAvQIrVDZJFsXO",
    //       status: "un-read",
    //       createTime: db.serverDate()
    //     }
    //   })
    // }));

    while(1) {
      res = await cloud.callFunction({
        name: "notification",
        data: {
          $url: "check"
        }
      });
      if (res.result.code === 1) {
        break;
      }
    }

    let accessToken = res.result.accessToken;

    let myDate = new Date();
    myDate = new Date(myDate.setHours(myDate.getHours() + 8));
    let data = {
      "touser": "",
      "template_id": "PClhDQdJsQMWpqDjdzdR29QAfL4ydoURpMvCtquyv1Y",
      "form_id": "",
      "page": "pages/notification/notification",
      "data": {
        "keyword1": {
          "value": "审核通过",
          "color": "#173177"
        },
        "keyword2": {
          "value": myDate.getFullYear() + "-" + (myDate.getMonth()+1) + "-" + myDate.getDate(),
          "color": "#173177"
        }
      }
    }
    
    await Promise.all(newOpenidList.map(item => {
      return db.collection("formid").where({
        _openid: item
      }).get().then(res => {
        if (res.data.length === 0 || res.data[0].formidArray.length === 0) return;
        else {
          let tmpArray = res.data[0].formidArray;
          let formid;
          while(1) {
            formid = tmpArray.shift();
            if (Date.parse(myDate) < Date.parse(formid.timeout)) break;
          }
          let tmpData = data;
          tmpData["touser"] = item;
          tmpData["form_id"] = formid.formid;
          console.log(res.data[0]._id);
          return db.collection("formid").doc(res.data[0]._id).update({
            data: {
              formidArray: JSON.parse(JSON.stringify(tmpArray))
            }
          })
          .then(res => {
            console.log(res);
            console.log(messageUrl+accessToken);
            console.log(tmpData);
            return apiReq(messageUrl+accessToken, tmpData)
          }).then(res => {
            console.log(res);
            if (res.errcode !== 0) {
              return cloud.callFunction({
                name: "notification",
                data: {
                  $url: "check",
                  isCheckNow: true
                }
              })
            } else {
              return Promise.resolve("");
            }
          })
          .then(res => {
            console.log(res);
            if (res !== "" && res.result.code === 1) {
              accessToken = res.assessToken;
              return apiReq(messageUrl+accessToken, tmpData)
            }
          })
          .catch(err => {console.log(err)});
        }
      })
    }))

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