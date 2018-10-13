const cloud = require('wx-server-sdk');

cloud.init()

const db = cloud.database();
const _ = db.command;

module.exports = {
  check: async (openid) => {
    let isAdmin;
    let res = await db.collection("admin-list").where({
      adminOpenId: openid
    }).get();

    if (res.data.length === 0) {
      isAdmin = false;
    } else {
      isAdmin = true;
    }

    return isAdmin;
  }
}