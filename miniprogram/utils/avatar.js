// avatar.js
const db = wx.cloud.database();
const app = getApp();

/**
 * 维护用户头像记录状态为最新
 * @param {*} that 
 * @param {string} avatarUrl 
 */
const checkAvatar = (that, avatarUrl) => {
  let msg = {};
  
  // 查询用户的openid 
  return (wx.cloud.callFunction({
    name: "login",
    data: {}
  })
  // 记下openid作为全局函数备用，使用openid查询是否存在该用户的头像记录
  .then(res => {
    let openid = res.result.openid;
    app.globalData.openid = res.result.openid;

    return db.collection("avatar").where({
      _openid: openid
    }).get()

  })
  // 根据查询结果判断是否需要添加或更新头像记录
  .then(res => {

    if (res.data.length === 0) {
      
      // 添加头像记录
      return db.collection("avatar").add({
        data: {
          avatarUrl: avatarUrl
        }
      })
      .then(res => {
        msg = {
          code: 1,
          msg: "avatar record added"
        };
        return msg;
      })

    } else if (res.data[0].avatarUrl !== avatarUrl) {

      // 更新头像记录
      return db.collection("avatar").doc(res.data[0]._id).update({
        data: {
          avatarUrl: avatarUrl
        }
      })
      .then(res => {
        msg = {
          code: 2,
          msg: "avatar record updated"
        };
        return msg;
      })

    } else {

      // 头像记录为最新，无需操作
      msg = {
        code: 0,
        msg: "avatar record is latest"
      };
      return msg;

    }
  })
  .catch(err => {

    msg = {
      code: -1,
      msg: "avatar check fail",
      err: err
    }
    return msg;
    
  }))
}

module.exports = {
  check: checkAvatar
}