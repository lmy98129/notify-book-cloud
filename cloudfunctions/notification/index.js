// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require("tcb-router");
const notify = require("./notification");

cloud.init()

const db = cloud.database();
const _ = db.command;

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

  app.router(["sendTemplateMessage"], async (ctx) => {
    ctx.body = await notify.sendTemplateMessage(event);
  })

  return app.serve();
}