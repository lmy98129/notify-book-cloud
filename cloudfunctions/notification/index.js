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
      // NOTE: 兼顾全体用户性质的消息
      let hasReadArray = [], unReadArray = [], tmpRes;
      let res = await db.collection("user-notification").where({
        userOpenid: openid 
      }).get();
      
      if (res.data.length === 0) {
        ctx.body = {
          code: 0,
        }
      } else {
        for (let item of res.data) {
          tmpRes = await db.collection("notification").where({
            _id: item.msgId
          }).get();
          item.content = tmpRes.data[0].content;
          item.title = tmpRes.data[0].title;
          item.date = new Date(item.createTime).toLocaleString().slice(5, -3);
          if (item.status === "un-read") unReadArray.push(item);
          else if (item.status === "has-read") hasReadArray.push(item);
        }
  
        ctx.body = {
          code: 1,
          hasReadArray,
          unReadArray,
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
  });

  app.router("delete", async (ctx) => {
    try {
      // NOTE: 还要继续改，如果是全体用户性质的反而要添加已删除数据
      let idArray = event.idArray;
      for (let item of idArray) {
        await db.collection("user-notification").doc(item).remove();
      }
      ctx.body = {
        code: 1,
      }
    } catch (error) {
      ctx.body = {
        code: -1,
      }
      console.log(error);
    }
  })

  app.router("changeStatus", async (ctx) => {
    try {
      let idArray = event.idArray;
      for (let item of idArray) {
        await db.collection("user-notification").doc(item).update({
          data: {
            status: event.status
          }
        })
      }
      ctx.body = {
        code: 1,
      }
    } catch (error) {
      ctx.body = {
        code: -1,
      }
      console.log(error);
    }
  })

  app.router("adminDownload", async (ctx) => {
    try {
      let res = await db.collection("notification").where({
        special: _.neq("accessToken")
      }).get();

      ctx.body = {
        code: 1,
        notification: res.data
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