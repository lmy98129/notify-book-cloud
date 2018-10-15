// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require("tcb-router");
const request = require("request");

cloud.init()

const db = cloud.database();
const _ = db.command;
const accessTokenUrl = "https://api.weixin.qq.com/cgi-bin/token?";
const grant_type = "client_credential";
const appid = "wxe9b916dde775d246";
const appsecret = "2998fbb540dcd5bc47c3cea6738ba77a";

const apiReq = (url) => new Promise((resolve, reject) => {
  request.get(url, (err, res, body) => {
    if (err) {
      reject(err);
    } else {
      resolve(body);
    }
  })
})

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

  app.router("check", async (ctx) => {
    try {
      let res = await db.collection("notification").where({
        special: "accessToken"
      }).get();
      if (res.data.length === 0) {
        let reqRes = await apiReq(accessTokenUrl+"grant_type="+grant_type+"&appid="+appid+"&secret="+appsecret);
        reqRes = JSON.parse(reqRes);
        if (reqRes["access_token"] === undefined && reqRes["errcode"] !== 0) {
          ctx.body = {
            code: -2,
          }
        } else {
          ctx.body = {
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
          let reqRes = await apiReq(accessTokenUrl+"grant_type="+grant_type+"&appid="+appid+"&secret="+appsecret);
          reqRes = JSON.parse(reqRes);          
          if (reqRes["access_token"] === undefined && reqRes["errcode"] !== 0) {
            ctx.body = {
              code: -2,
            }
          } else {
            ctx.body = {
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
          ctx.body = {
            code: 1,
            accessToken: res.data[0].accessToken
          }
        }
      }
    } catch (error) {
      ctx.body = {
        code: -1,
      }
      console.log(error);
    }
  })

  return app.serve();
}