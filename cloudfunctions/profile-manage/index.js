// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require("tcb-router");

cloud.init()

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const app = new TcbRouter({ event });

  app.router("uploadProfile", async (ctx) => {
    try {
      let { profile, collection, _id } = event;

      let updateRes = await db.collection(collection).doc(_id).update({
        data: profile
      });

      ctx.body = {
        code: 1,
        updateRes,
      } 
    } catch (error) {
      console.log(error)
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("uploadAvatar", async (ctx) => {
    try {
      let { avatarUrl, collection, _id, isAvatarCustomed } = event;
      if (isAvatarCustomed === "true") {
        isAvatarCustomed = true;
      } else if (isAvatarCustomed === "false") {
        isAvatarCustomed = false;
      }

      let updateRes = await db.collection(collection).doc(_id).update({
        data: {
          avatarUrl,
          isAvatarCustomed,
        }
      })

      ctx.body = {
        code: -1,
        updateRes
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("uploadBgImg", async (ctx) => {
    try {
      let { bgImgUrl, collection, _id, isBgImgCustomed } = event;
      if (isBgImgCustomed === "true") {
        isBgImgCustomed = true;
      } else if (isBgImgCustomed === "false") {
        isBgImgCustomed = false;
      }
      let updateRes = await db.collection(collection).doc(_id).update({
        data: {
          bgImgUrl,
          isBgImgCustomed
        }
      })
      ctx.body = {
        code: 1,
        updateRes
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("deleteProfile", async (ctx) => {
    try {
      let { _id, collection } = event;

      let deleteRes = await db.collection(collection).doc(_id).remove();

      ctx.body = {
        code: 1,
        deleteRes
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })
  
  app.router("uploadIntro", async (ctx) => {
    try {
      let { _id, collection, intro } = event;

      let updateRes = await db.collection(collection).doc(_id).update({
        data: { intro }
      })

      ctx.body = {
        code: 1,
        updateRes
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  return app.serve();
}