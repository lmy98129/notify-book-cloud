// 云函数入口文件
const cloud = require('wx-server-sdk');
const TcbRouter = require("tcb-router");

cloud.init()

const profile = require("./middleware/profile");
const auth = require("./middleware/auth");
const admin = require("./middleware/admin");

// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({ event });
  const openid = event.userInfo.openId;
  let detailed;

  if (event.detailedUserInfo !== undefined) {
    detailed = event.detailedUserInfo;
  }

  app.router(["login", "check"], async (ctx, next) => {
    try {
      ctx.data = {};
      
      // 检测并获取资料
      ctx.data.profile = await profile.check(openid, detailed);
      await next();
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -4
      }
    }
  }, async(ctx) => {
    try {
              
      // 检测用户是否是管理员
      ctx.data.isAdmin = await admin.check(openid);

      // 检测用户认证情况
      if (ctx.data.isAdmin) {
        ctx.data.authStatus = "authorized";
      } else {
        ctx.data.authStatus = await auth.check(openid);
      }

      ctx.body = {
        code: 1,
        data: ctx.data
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -4
      }
    }

  });

  return app.serve();
}