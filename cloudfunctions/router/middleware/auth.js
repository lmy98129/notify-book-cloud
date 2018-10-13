const cloud = require('wx-server-sdk');

cloud.init()

const db = cloud.database();
const _ = db.command;

module.exports = {
  check: async (openid) => {
    let data, authStatus;
    let res = await db.collection("auth").where({ openid }).get();
    
    // 新用户
    if (res.data.length === 0) {
      data = {
          openid,
          authImgUrl: "",
          remark: "",
          status: "unauthorized",
          isCode: false
      }
      db.collection("auth").add({ data });
      authStatus = "unauthorized";

    } 
    // 老用户
    else {
      authStatus = res.data[0].status;
    }
    return authStatus;
  }
}