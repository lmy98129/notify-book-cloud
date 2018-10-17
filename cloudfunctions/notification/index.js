// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require("tcb-router");
const request = require("request");

cloud.init()

const db = cloud.database();
const _ = db.command;
const accessTokenUrl = "https://api.weixin.qq.com/cgi-bin/token?";
const messageUrl = "https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=";
const grant_type = "client_credential";
const appid = "wxe9b916dde775d246";
const appsecret = "2998fbb540dcd5bc47c3cea6738ba77a";

const apiReqGet = (url) => new Promise((resolve, reject) => {
  request.get(url, (err, res, body) => {
    if (err) {
      reject(err);
    } else {
      resolve(body);
    }
  })
})

const apiReqPost = (url, body) => new Promise((resolve, reject) => {
  request({url, method: "POST", json: true, body}, (err, res, body) => {
    if (err) {
      reject(err);
    } else {
      resolve(body);
    }
  })
})

const check = async () => {
  try {
    let msg;
    let res = await db.collection("notification").where({
      special: "accessToken"
    }).get();
    if (res.data.length === 0) {
      let reqRes = await apiReqGet(accessTokenUrl+"grant_type="+grant_type+"&appid="+appid+"&secret="+appsecret);
      reqRes = JSON.parse(reqRes);
      if (reqRes["access_token"] === undefined && reqRes["errcode"] !== 0) {
        msg = {
          code: -2,
        }
      } else {
        msg = {
          code: 1,
          accessToken: reqRes["access_token"]
        }
        await db.collection("notification").add({
          data: {
            special: "accessToken",
            accessToken: reqRes["access_token"],
            timeout: db.serverDate({
              offset: reqRes["expires_in"] * 1000
            })
          }
        });
      }

      
    } else {
      let myDate = new Date();
      if (Date.parse(new Date(myDate.setHours(myDate.getHours() + 8))) > Date.parse(res.data[0].timeout) || event.isCheckNow) {
        let reqRes = await apiReqGet(accessTokenUrl+"grant_type="+grant_type+"&appid="+appid+"&secret="+appsecret);
        reqRes = JSON.parse(reqRes);          
        if (reqRes["access_token"] === undefined && reqRes["errcode"] !== 0) {
          msg = {
            code: -2,
          }
        } else {
          msg = {
            code: 1,
            accessToken: reqRes["access_token"]
          }
          await db.collection("notification").doc(res.data[0]._id).update({
            data: {
              accessToken: reqRes["access_token"],
              timeout: db.serverDate({
                offset: reqRes["expires_in"] * 1000
              })
            }
          })
        }
      } else {
        msg = {
          code: 1,
          accessToken: res.data[0].accessToken
        }
      }
    }
    return msg;
  } catch (error) {
    msg = {
      code: -1,
    }
    console.log(error);
    return msg;
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({ event });
  const openid = event.userInfo.openId;

  app.router("download", async (ctx) => {
    try {
      let notification = [], tmpRes;
      let res = await db.collection("user-notification").where({
        userOpenid: openid 
      }).get();


      if (res.data.length === 0) {
        ctx.body = {
          code: 0,
        }
      } else {
        res.data.map(async item => {
          tmpRes = await db.collection("notification").where({
            _id: item.msgId
          }).get();
          item.detail = tmpRes.data[0];
          notification.push(item);
        })
  
        ctx.body = {
          code: 1,
          notification,
        }
      }
    } catch (error) {
      ctx.body = {
        code: -1,
      }
      console.log(error);
    }
  });

  app.router("sendTemplateMessage", async (ctx) => {
    let result;
    try {
      while(1) {
        result = await check();
        if (result.code === 1) break;
      }

    let accessToken = result.accessToken;
    let data = event.data;
    let openidList = event.openidList;
    let myDate = new Date();
    myDate = new Date(myDate.setHours(myDate.getHours() + 8));
    console.log(openidList);
    
    for (let item of openidList) {
      console.log("hey", item);
      let res = await db.collection("formid").where({
        _openid: item
      }).get();
      console.log(res);
      if (res.data.length === 0 || res.data[0].formidArray.length === 0) break;
      else {
        let tmpArray = res.data[0].formidArray;
        let formid;
        while(tmpArray.length > 0) {
          formid = tmpArray.shift();
          if (Date.parse(myDate) < Date.parse(formid.timeout)) break;
          if (tmpArray.length == 0) break;
        }
        let tmpData = data;
        tmpData["touser"] = item;
        tmpData["form_id"] = formid.formid;
        console.log(res.data[0]._id);
        await db.collection("formid").doc(res.data[0]._id).update({
          data: {
            formidArray: JSON.parse(JSON.stringify(tmpArray))
          }
        });
        console.log(tmpData);
        while(1) {
          res = await apiReqPost(messageUrl+accessToken, tmpData);
          console.log(res);
          if (res.errcode !== 0) {
            res = await check();
            accessToken = res.accessToken;
          } else break;
        }
      }
    }

    ctx.body = {
      code: 0,
      msg: "send succeed"
    }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        msg: "send failed",
        err: error
      }
    }
  })

  return app.serve();
}