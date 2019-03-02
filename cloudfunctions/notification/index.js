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
      let hasReadArray = [], unReadArray = [], tmpRes, myDate;
      // 先获取用户除了删除过的信息以外的非群发信息
      let res = await db.collection("user-notification").where({
        userOpenid: openid,
        status: _.neq("delete")
      }).get();
      if (res.data.length !== 0) {
        // 对每条信息获取其对应内容
        for (let item of res.data) {
          tmpRes = await db.collection("notification").where({
            _id: item.msgId
          }).get();
          // 若该信息的userList不等于"0"也就是说不等于群发信息
          if (tmpRes.data[0].userList !== "0") {
            // 处理一下时间格式
            myDate = new Date(item.createTime);
            item.content = tmpRes.data[0].content;
            item.title = tmpRes.data[0].title;
            item.date = new Date(myDate.setHours(myDate.getHours() + 8)).toLocaleString().slice(5, -3);
            if (item.status === "un-read") unReadArray.push(item);
            else if (item.status === "has-read") hasReadArray.push(item);
          }
        }
      }
      // 再获取群发的信息
      res = await db.collection("notification").where({
        userList: "0"
      }).get();
      if (res.data.length !== 0) {
        for (let item of res.data) {
          // 注意不能把用户已经删除了的信息再获取进来
          tmpRes = await db.collection("user-notification").where({
            msgId: item._id,
            userOpenid: openid,
            status: _.neq("delete")
          }).get();
          delete item.userList;
          item._id = "ALL,"+item._id;
          // 同样处理时间
          if (tmpRes.data.length !== 0) {
            myDate = new Date(item.createTime);
            item.date = new Date(myDate.setHours(myDate.getHours() + 8)).toLocaleString().slice(5, -3);
            item.status = tmpRes.data[0].status;
            if (tmpRes.data[0].status === "un-read") unReadArray.push(item);
            else if (tmpRes.data[0].status === "has-read") hasReadArray.push(item);
          } else {
            tmpRes = await db.collection("user-notification").where({
              userOpenid: openid,
              status: _.eq("delete")
            }).get();
            // 如果发现对于群发的消息，删除了的也没有、没删除了的也没有，就说明是用户未读的，加入未读序列（这就是所谓的新增用户的补发了）
            // 也就是说补发的消息一般是不予以微信模板消息的，因为可能出现重复发送的情况
            //（首次登录未读和多次登录之后登录未读会被当成一种情况，而且既然登录了就应当看得见前端的红点提示，就不需要模板消息画蛇添足了）
            if (tmpRes.data.length === 0) {
              myDate = new Date(item.createTime);
              item.status = "un-read";
              item.date = new Date(myDate.setHours(myDate.getHours() + 8)).toLocaleString().slice(5, -3);
              unReadArray.push(item);
            }
          }
        }
      }
      if (unReadArray.length === 0 && hasReadArray.length === 0) {
        ctx.body = {
          code: 0
        }
      } else {
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
      let idArray = event.idArray;
      for (let item of idArray) {
        if (item.indexOf("ALL,") >= 0) {
          let res = await db.collection("user-notification").where({
            userOpenid: openid,            
            msgId: item.split(",")[1]
          }).get();
          if (res.data.length === 0) {
            await db.collection("user-notification").add({
              data: {
                userOpenid: openid,
                msgId: item.split(",")[1],
                status: "delete",
                createTime: db.serverDate()
              }
            })
          } else {
            await db.collection("user-notification").doc(res.data[0]._id).update({
              data: {
                status: "delete"
              }
            })
          }
        } else {
          await db.collection("user-notification").doc(item).remove();
        }
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
        if (item.indexOf("ALL,") >= 0) {
          let res = await db.collection("user-notification").where({
            userOpenid: openid,  
            msgId: item.split(",")[1]
          }).get();
          if (res.data.length === 0) {
            await db.collection("user-notification").add({
              data: {
                userOpenid: openid,
                msgId: item.split(",")[1],
                status: event.status,
                createTime: db.serverDate()
              }
            })
          } else {
            await db.collection("user-notification").doc(res.data[0]._id).update({
              data: {
                status: event.status
              }
            })
          }
        } else {
          await db.collection("user-notification").doc(item).update({
            data: {
              status: event.status
            }
          })
        }
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

  app.router("adminUpdate", async (ctx) => {
    try {
      let notifyDetail = event.notifyDetail, newUserList, oldUserList
      if (notifyDetail.userList === "0") {
        newUserList = []
      } else if (typeof notifyDetail.userList === "string") {
        newUserList = [notifyDetail.userList]
      } else {
        newUserList = notifyDetail.userList
      }
      let data = {
        "touser": "",
        "template_id": "dRQUGRibkcdSUP79L-Up6_slYyk2g-yL3uZaYOdKhHU",
        "form_id": "",
        "page": "pages/notification/notification",
        "data": {
          "keyword1": {
            "value": event.notifyDetail.title,
            "color": "#173177"
          },
          "keyword2": {
            "value": event.notifyDetail.content,
            "color": "#173177"
          }
        }
      }
      let res = await db.collection("notification").doc(event.id).get();
      if (res.data.userList === "0") {
        oldUserList = [];
      } else if (typeof res.data.userList === "string") {
        oldUserList = [res.data.userList]
      } else {
        oldUserList = res.data.userList;
      }
      res = await notify.updateUserListChecker(newUserList, oldUserList, event.id);
      switch(res.code) {
        case 1:
        case 2:
          await db.collection("notification").doc(event.id).remove();
          await db.collection("user-notification").where({
            msgId: event.id
          }).remove();
          await cloud.callFunction({
            name: "notification",
            data: {
              $url: "adminAdd",
              notifyDetail
            }
          })
          break;
        case 3:
          await db.collection("notification").doc(event.id).update({
            data: notifyDetail
          });
          for (let item of res.extraUserOpenidList) {
            await db.collection("user-notification").add({
              data: {
                userOpenid: item,
                msgId: event.id,
                status: "un-read",
                createTime: db.serverDate()
              }
            });
          }
          for (let item of res.deleteUserOpenidList) {
            await db.collection("user-notification").where({
              userOpenid: item
            }).remove();
          }
          await cloud.callFunction({
            name: "notification",
            data: {
              $url: "sendTemplateMessage",
              data,
              openidList: res.extraUserOpenidList
            }
          });
          break;
        case 4:
          await db.collection("notification").doc(event.id).update({
            data: notifyDetail
          });
          break;
      }

      ctx.body = {
        code: 1
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1
      }
    }
  });

  app.router("adminDelete", async (ctx) => {
    try {
      for (let item of event.idArray) {
        await db.collection("notification").doc(item).remove();
        await db.collection("user-notification").where({
          msgId: item
        }).remove();
      }
      ctx.body = {
        code: 1
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1
      }
    }
  });

  app.router("adminAdd", async (ctx) => {
    try {
      let data = {
        "touser": "",
        "template_id": "dRQUGRibkcdSUP79L-Up6_slYyk2g-yL3uZaYOdKhHU",
        "form_id": "",
        "page": "pages/notification/notification",
        "data": {
          "keyword1": {
            "value": event.notifyDetail.title,
            "color": "#173177"
          },
          "keyword2": {
            "value": event.notifyDetail.content,
            "color": "#173177"
          }
        }
      }
      event.notifyDetail.createTime = db.serverDate();
      let res = await db.collection("notification").add({
        data: event.notifyDetail
      });
      let _id = res._id;
      let openidList = [];
      if (typeof event.notifyDetail.userList === "string" && event.notifyDetail.userList !== "0") {
        event.notifyDetail.userList = [event.notifyDetail.userList];
      }
      if (event.notifyDetail.userList !== "0") {
        for(let item of event.notifyDetail.userList) {
          res = await db.collection("profile").where({
            realName: item
          }).get();
          if(res.data.length === 0) {
            res = await db.collection("profile").where({
              nickName: item
            }).get();
            if (res.data.length === 0) continue;
          } 
          openidList.push(res.data[0]._openid);
          await db.collection("user-notification").add({
            data: {
              userOpenid: res.data[0]._openid,
              msgId: _id,
              status: "un-read",
              createTime: db.serverDate()
            }
          });
        }
      } else {
        res = await db.collection("profile").count();
        let total = res.total, allProfile = [], skip = 0;
        while(skip <= total) {
          res = await db.collection("profile").skip(skip).limit(100).get();
          allProfile = allProfile.concat(res.data);
          skip += 100;
        }
        console.log(allProfile)
        for (let item of allProfile) {
          openidList.push(item._openid);
        }
      }

      await cloud.callFunction({
        name: "notification",
        data: {
          $url: "sendTemplateMessage",
          data,
          openidList
        }
      });
      
      ctx.body = {
        code: 1
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1
      }
    }
  })

  return app.serve();
}