// profile.js
const db = wx.cloud.database();
const app = getApp();

const download = () => {
  let msg = {};
  return (db.collection("profile").where({
    _openid: wx.getStorageSync("openid")
  })).get()
  .then(res => {
    if (res.data.length === 0) {
      msg = {
        code: 1,
        msg: "profile not found"
      }
      return Promise.resolve(msg);
    } else if (res.data[0] !== undefined) {
      msg = {
        code: 2,
        msg: "profile exist",
        data: res.data[0]
      }
      return Promise.resolve(msg);
    }
  })
  .catch(err => {
    msg = {
      code: -1,
      msg: "profile download fail",
      err: err
    }
    return Promise.reject(msg);
  })
}

const upload = (userInfo) => {
  let msg = {};
  return (db.collection("profile").where({
    _openid: wx.getStorageSync("openid")
  }).get()
  .then(res => {
    if (res.data.length === 0) {
      return db.collection("profile").add({
        data: userInfo
      })
      .then(res => {
        msg = {
          code: 1,
          msg: "profile record added"
        };
        return Promise.resolve(msg);
      })
    } else if (res.data[0] !== undefined) {
      return db.collection("profile")
      .doc(res.data[0]._id).update({
        data: userInfo
      }).then(res => {
        msg = {
          code: 2,
          msg: "profile record updated"
        };
        return Promise.resolve(msg);
      })
    }
  }))
  .catch(err => {
    msg = {
      code: -1,
      msg: "profile upload fail",
      err: err
    }
    return Promise.reject(msg);
  })
}

const introUpload = (intro) => {
  let msg = {};
  return (db.collection("profile").where({
    _openid: wx.getStorageSync("openid")
  }).get()
  .then(res => {
    return db.collection("profile")
    .doc(res.data[0]._id).update({
      data: {
        intro: intro
      }
    }).then(res => {
      msg = {
        code: 0,
        msg: "profile intro updated"
      }
      return Promise.resolve(msg);
    })
  })
  .catch(err => {
    msg = {
      code: 0,
      msg: "profile intro updated failed",
      err: err
    }
    return Promise.reject(msg);
  }))
}

module.exports = {
  upload: upload,
  download: download,
  introUpload: introUpload
}