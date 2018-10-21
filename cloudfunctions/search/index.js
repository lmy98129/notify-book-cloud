// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database();
const _ = db.command;

const increase = (rank, keyFound, item, weight, key) => {
  if (rank[item._id] === undefined) {
    rank[item._id] = 0
  } 
  rank[item._id] += weight

  if (keyFound[item._id] === undefined) {
    keyFound[item._id] = [];
  }
  keyFound[item._id].push(key)
}

const search = (data, text, keyArray, weight) => {
  let rank = [], keyFound = [];
  keyArray.map(key => {
    switch(key) {
      case "institution":
      case "job":
      case "jobStartTime":
      case "jobEndTime":
        data.map(item => {
          if (item.jobArray === undefined) {
            return;
          }
          item.jobArray.map(subItem => {
            if (subItem[key].indexOf(text) >-1) {
              increase(rank, keyFound, item, weight, key);
            }
          })
        })
        break;
      case "contactType":
      case "content":
        data.map(item => {
          if (item.contactArray === undefined) {
            return;
          }
          item.contactArray.map(subItem => {
            if (subItem[key].indexOf(text) >-1) {
              increase(rank, keyFound, item, weight, key);
            }
          })
        })
        break;
      default:
        data.map(item => {
          let contentStr = "";
          if (item[key] === undefined) {
            return;
          }
          if (key === "phoneNumber") {
            contentStr = item[key].toString();
          } else {
            contentStr = item[key];
          }
          if (contentStr.indexOf(text) >-1 ) {
            increase(rank, keyFound, item, weight, key);
          }
        })
        break;
    }
  })
  return {rank, keyFound};
}

const combine = (res1, res2) => {
  let rank1 = res1.rank, rank2 = res2.rank, 
  keyFound1 = res1.keyFound, keyFound2 = res2.keyFound;

  for (item in rank2) {
    if (rank1[item]) {
      rank1[item] += rank2[item]
    } else {
      rank1[item] = rank2[item]
    }
  }

  for (item in keyFound2 ) {
    if (keyFound1[item]) {
      keyFound1[item] = keyFound1[item].concat(keyFound2[item])
    } else {
      keyFound1[item] = keyFound2[item]
    }
  }

  return {rank: rank1, keyFound: keyFound1};
}


const searchProfile = (data, requestArray) => {
  let searchRes = [], final = [];
  for (i in requestArray) {
    searchRes.push(search(
      data, requestArray[i].text, 
      requestArray[i].keyArray, 
      requestArray[i].weight
    ));
  }

  let combineRes = searchRes[0]
  for (let i=1; i<searchRes.length; i++) {
    combineRes = combine(searchRes[i], combineRes);
  }

  for (i in data) {
    for (item in combineRes.keyFound) {
      if (data[i]._id === item) {
        let tmpItem = data[i];
        tmpItem.keyFound = combineRes.keyFound[item];
        tmpItem.rank = combineRes.rank[item];
        final.push(tmpItem);
      }
    }
  }

  final.sort((x, y) => {
    return y.rank - x.rank;
  });

  return final;
}

const sleep = (numberMillis) => { 
  var now = new Date(); 
  var exitTime = now.getTime() + numberMillis; 
  while (true) { 
    now = new Date(); 
    if (now.getTime() > exitTime) 
    return; 
  } 
}


// 云函数入口函数
exports.main = async (event, context) => {
  try {
    let allProfile = [], skip = 0, 
      text = event.text, start = event.start, limit = event.limit, 
      requestArray = event.requestArray, pageLength = event.pageLength,
      collection = event.collection;
    let res = await db.collection(collection).count();
    let total = res.total;
    while(skip <= total) {
      res = await db.collection(collection).skip(skip).limit(100).get();
      allProfile = allProfile.concat(res.data);
      skip += 100;
    }

    text = text.replace(/[\_\,\!\|\~\`\(\)\#\$\%\^\&\*\{\}\:\;\"\L\<\>\?]/g, '');

    if (text === "" || text === "-") {
      return {
        code: 1,
        searchRes: []
      }
    }

    let searchRes = 
    searchProfile(allProfile, requestArray);

    total = searchRes.length;

    if (total > pageLength && start != undefined) {
      searchRes = searchRes.slice(start, start + pageLength);
      start += pageLength;
    }

    if (limit != undefined) {
      searchRes = searchRes.slice(0, limit);
    }

    
    let avatar = [];
    for (let i=0; i<searchRes.length; i++) {
      res = await db.collection("avatar").where({
        _openid: searchRes[i]._openid
      }).get();
      avatar.push(res.data[0]);
    }

    for (item in searchRes) {
      for (subItem in avatar) {
        if (avatar[subItem] === undefined) {
          continue;
        } else if (avatar[subItem]._openid === searchRes[item]._openid) {
          searchRes[item].avatarUrl = avatar[subItem].avatarUrl
        }
      }
    }


    return {
      code: 1,
      searchRes,
      start,
      total
    }

  } catch (error) {
    console.log(error);
    return {
      code: -1,
      err: error
    }
  }
}