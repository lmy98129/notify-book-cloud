const cloud = require('wx-server-sdk');
const request = require("request");

cloud.init()

const db = cloud.database();
const _ = db.command;

const accessTokenUrl = "https://api.weixin.qq.com/cgi-bin/token?";
const messageUrl = "https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=";
const grant_type = "client_credential";
const appid = "wxe9b916dde775d246";
const appsecret = "2998fbb540dcd5bc47c3cea6738ba77a";

module.exports = {
  apiReqGet: (url) => {
    return new Promise((resolve, reject) => {
      request.get(url, (err, res, body) => {
        if (err) {
          reject(err);
        } else {
          resolve(body);
        }
      })
    })
  },

  apiReqPost(url, body) {
    return new Promise((resolve, reject) => {
      request({url, method: "POST", json: true, body}, (err, res, body) => {
        if (err) {
          reject(err);
        } else {
          resolve(body);
        }
      })
    })
  },

  async check(){
    try {
      let msg;
      let res = await db.collection("notification").where({
        special: "accessToken"
      }).get();
      if (res.data.length === 0) {
        let reqRes = await this.apiReqGet(accessTokenUrl+"grant_type="+grant_type+"&appid="+appid+"&secret="+appsecret);
        reqRes = JSON.parse(reqRes);
        if (reqRes["access_token"] === undefined && reqRes["errcode"] !== 0) {
          msg = {
            code: -2,
          }
        } else {
          msg = {
            code: 1,
            accessToken: reqRes["access_token"]
          }
          await db.collection("notification").add({
            data: {
              special: "accessToken",
              accessToken: reqRes["access_token"],
              timeout: db.serverDate({
                offset: reqRes["expires_in"] * 1000
              })
            }
          });
        }      
      } else {
        let myDate = new Date();
        if (Date.parse(new Date(myDate.setHours(myDate.getHours() + 8))) > Date.parse(res.data[0].timeout) || event.isCheckNow) {
          let reqRes = await this.apiReqGet(accessTokenUrl+"grant_type="+grant_type+"&appid="+appid+"&secret="+appsecret);
          reqRes = JSON.parse(reqRes);          
          if (reqRes["access_token"] === undefined && reqRes["errcode"] !== 0) {
            msg = {
              code: -2,
            }
          } else {
            msg = {
              code: 1,
              accessToken: reqRes["access_token"]
            }
            await db.collection("notification").doc(res.data[0]._id).update({
              data: {
                accessToken: reqRes["access_token"],
                timeout: db.serverDate({
                  offset: reqRes["expires_in"] * 1000
                })
              }
            })
          }
        } else {
          msg = {
            code: 1,
            accessToken: res.data[0].accessToken
          }
        }
      }
      return msg;
    } catch (error) {
      msg = {
        code: -1,
      }
      console.log(error);
      return msg;
    }
  },

  async sendTemplateMessage(event) {
    let result;
    try {
      while(1) {
        result = await this.check();
        if (result.code === 1) break;
      }

    let accessToken = result.accessToken;
    let data = event.data;
    let openidList = event.openidList;
    let myDate = new Date();
    myDate = new Date(myDate.setHours(myDate.getHours() + 8));
    console.log(openidList);
    
    for (let item of openidList) {
      let res = await db.collection("formid").where({
        _openid: item
      }).get();
      if (res.data.length === 0 || res.data[0].formidArray.length === 0) continue;
      else {
        let tmpArray = res.data[0].formidArray;
        let formid, isEmpty = false;
        while(tmpArray.length > 0) {
          formid = tmpArray.shift();
          if (Date.parse(myDate) < Date.parse(formid.timeout)) break;
          if (tmpArray.length == 0) isEmpty=true;
        }
        if (isEmpty) break;
        let tmpData = data;
        tmpData["touser"] = item;
        tmpData["form_id"] = formid.formid;
        console.log(res.data[0]._id);
        await db.collection("formid").doc(res.data[0]._id).update({
          data: {
            formidArray: JSON.parse(JSON.stringify(tmpArray))
          }
        });
        console.log(tmpData);
        while(1) {
          res = await this.apiReqPost(messageUrl+accessToken, tmpData);
          console.log(res);
          if (res.errcode !== 0) {
            res = await this.check();
            accessToken = res.accessToken;
          } else break;
        }
      }
    }

    return {
      code: 0,
      msg: "send succeed"
    }

    } catch (error) {
      console.log(error);
      return {
        code: -1,
        msg: "send failed",
        err: error
      }
    }
  },

  getAll: async function (collection) {
    try {
      let res = await db.collection(collection).count();
      let total = res.total, allRecords = [], skip = 0;
      while(skip <= total) {
        res = await db.collection(collection).skip(skip).limit(100).get();
        allRecords = allRecords.concat(res.data);
        skip += 100;
      }
      return allRecords;
    } catch (error) {
      console.log(error);
    }
  },

  getUserOpenid: async function(userList) {
    let res, openidList = [];
    try {
      for (let item of userList) {
        res = await db.collection("profile").where({
          realName: item
        }).get();
        if(res.data.length === 0) {
          res = await db.collection("profile").where({
            nickName: item
          }).get();
          if (res.data.length === 0) break;
        } 
        openidList.push(res.data[0]._openid);
      }
      return openidList;
    } catch (error) {
      console.log(error);
    }
  },

  updateUserListChecker: async function (newUserList, oldUserList, id) {
    try {
      if (newUserList.length === 0 && oldUserList.length !== 0) {
        // await db.collection("notification").doc(id).update({
        //   data: {
        //     userList: "0"
        //   }
        // });
        // let allRecords = await this.getAll("profile");
        // let flag, extraUserList = [];
        // for (let item1 of allRecords) {
        //   flag = false;
        //   for (let item2 of oldUserList) {
        //     if (item1.realName === item2 || item1.nickName === item2) {
        //       flag = true;
        //       break;
        //     }
        //   }
        //   if (!flag)  extraUserList.push(item1._openid);
        // }
        return {
          code: 1,
          msg: "spec -> all, original message with relationships deleted, new message will be set, every user will get the new message",
          // extraUserList,
        }
      }
      else if (newUserList.length !== 0 && oldUserList.length === 0) {
        // await db.collection("notification").doc(id).update({
        //   data: {
        //     userList: newUserList
        //   }
        // });
        // let extraUserList = await this.getUserOpenid(newUserList);
        return {
          code: 2,
          msg: "all -> spec, original message with relationships deleted, new message will be set, specific user will get the new message",
          // extraUserList
        }
      }
      else if (newUserList.length !== 0 && oldUserList.length !== 0){
        await db.collection("notification").doc(id).update({
          data: {
            userList: newUserList
          }
        });
        let extraUserList = [], deleteUserList = [], flag;
        for (let item1 of newUserList) {
          flag = false;
          for (let item2 of oldUserList) {
            if (item1 === item2) flag = true;
          }
          if (!flag) extraUserList.push(item1);
        }
        for (let item1 of oldUserList) {
          flag = false;
          for (let item2 of newUserList) {
            if (item1 === item2) flag = true;
          }
          if (!flag) deleteUserList.push(item1);
        }
        let extraUserOpenidList = await this.getUserOpenid(extraUserList);
        let deleteUserOpenidList = await this.getUserOpenid(deleteUserList);
        return {
          code: 3, 
          msg: "spec -> spec, re-send for users in extraUserOpenidList, delete for users in deleteUserOpenidList",
          extraUserOpenidList,
          deleteUserOpenidList
        }
      }
      else if (newUserList.length === 0 && oldUserList.length === 0) {
        return {
          code: 4,
          msg: "all -> all, nothing has to be changed"
        }
      }
      
    } catch (error) {
      console.log(error);
    }
  }
}