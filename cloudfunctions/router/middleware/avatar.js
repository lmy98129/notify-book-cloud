const cloud = require('wx-server-sdk');

cloud.init()

const db = cloud.database();
const _ = db.command;

module.exports = {
  check: (data, wechatUserInfo) => {
    let msg = "";

    // 头像采用微信头像，且需要更新头像记录
    if (!data.isAvatarCustomed && data.avatarUrl !== wechatUserInfo.avatarUrl) {
      db.collection("profile").doc(data._id).update({
        data: {
          avatarUrl: wechatUserInfo.avatarUrl,
        }
      })

      msg += ", wechat avatar record updated";
    }

    return {
      msg, data
    }
  }
}