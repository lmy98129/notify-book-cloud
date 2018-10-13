const cloud = require('wx-server-sdk');

cloud.init()

const db = cloud.database();
const _ = db.command;

module.exports = {
  
}