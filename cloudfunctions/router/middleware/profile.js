const cloud = require('wx-server-sdk');

cloud.init()

const db = cloud.database();
const _ = db.command;

const avatar = require("./avatar");

module.exports = {
  check: async (openid, wechatUserInfo) => {
    try {
      let msg, data;

      // 查询数据库
      let res = await db.collection("profile").where({ openid }).get();
      
      // 新用户，新建一条记录
      if (res.data.length === 0) {
        data = {
          openid,
          nickName: wechatUserInfo.nickName,
          avatarUrl: wechatUserInfo.avatarUrl,
          bgImgUrl: "",
          isAvatarCustomed: false,
          isNickNameCustomed: false,
        }
        db.collection("profile").add({ data });

        return {
          code: 0,
          msg: "new profile record added & nickName uploaded",
          data,
        }
      } 

      // 老用户
      else {
        data = res.data[0];
        msg = "profile exist";

        // 检测头像是否出现更新
        res = await avatar.check(data, wechatUserInfo);
        msg += res.msg;
        data = res.data;
        
        // 检测用户有无其他资料信息
        if (data.realName != undefined){
          return {
            code: 2,
            msg: msg + ", having detailed content",
            data,
          }
        } else {
          return {
            code: 1,
            msg: msg + ", staying empty with only nickName",
            data,
          }
        }

      }
      
    } catch (error) {
      return {
        code: -4,
        msg: JSON.stringify(error)
      }
    }
  }
}
