// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  let { TENCENTCLOUD_SECRETID, TENCENTCLOUD_SECRETKEY, TENCENTCLOUD_SESSIONTOKEN } = process.env;
  return {
    TENCENTCLOUD_SECRETID,
    TENCENTCLOUD_SECRETKEY,
    TENCENTCLOUD_SESSIONTOKEN,
    openid: event.userInfo.openId,
  }
}