// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database();
const _ = db.command;

// 增加记录的权重
const increase = (idArray, rank, keyFound, weight, key) => {
  for (item of idArray) {
    if (rank[item._id] === undefined) {
      rank[item._id] = 0;
    } 
    rank[item._id] += weight;
  
    if (keyFound[item._id] === undefined) {
      keyFound[item._id] = [];
    }
    keyFound[item._id].push(key);
  }
}

const search = async (collection, text, weightArray) => {
  // rank用于计算当前记录的总权重
  // keyFound用于存储当前记录中涉及的键
  let rank = [], keyFound = [];
  // 先把weightArray中的key提取出来，weightArray[key]为weight值
  for (key in weightArray) {
    let query, arrayType;
    switch(key) {
      case "institution":
      case "job":
      case "jobStartTime":
      case "jobEndTime":
        arrayType = "jobArray";
        break;
      case "contactType":
      case "content":
        arrayType = "contactArray";
        break;
      case "degree":
      case "degreeEndTime":
      case "degreeStartTime":
      case "headTeacher":
      case "major":
      case "school":
        arrayType = "degreeArray";
        break;
      default:
        if (key === "phoneNumber") {
          text = text.toString();
        }
        break;
    }
    // 拼装查询条件query
    // TODO: 此处理应添加上authStatus: "authorized", isProfileEmpty: false等约束
    // 等结束测试后再加上
    if (arrayType !== undefined && arrayType !== "") {
      query = {
        [arrayType]: {
          $elemMatch: {
            [key]: db.RegExp({
              regexp: text,
              options: "im",
            })
          }
        },
      }
    } else {
      query = {
        [key]: db.RegExp({
          regexp: text,
          options: "im",
        })
      }
    }
    // 进行实际查询
    let searchRes = await db.collection(collection)
      .field({ _id: true }).where(query).get();
    // 如果没有出现空且长度大于0，增加权重
    if (key == "homeTown") console.log(query, searchRes);
    if (searchRes.data !== undefined && searchRes.data.length >= 0) {
      increase(searchRes.data, rank, keyFound, weightArray[key], key);
    }
  }
  
  return { rank, keyFound };

}

// 合并不同查询内容的权重
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

const searchMain = async (collection, requestArray) => {
  // 查找
  let searchRes = [], final = [], weightArray = [];
  for (request of requestArray) {
    let { text, weight } = request;
    text = text.replace(/[\_\,\!\|\~\`\(\)\#\$\%\^\&\*\{\}\:\;\"\L\<\>\?]/g, '');
    // 发送了空的内容，就不调用数据库了
    if (text === "" || text === "-") {
      continue;
    }
    // 把所有的weight都转化成key-value形式
    for (item of weight) {
      let { value, keyArray } = item;
      for (key of keyArray) {
        weightArray[key] = value;
      }
    }

    searchRes.push(await search(collection ,text, weightArray));
  }

  // 合并不同内容查找的结果
  let combineRes = searchRes[0]
  for (let i=1; i<searchRes.length; i++) {
    combineRes = combine(searchRes[i], combineRes);
  }

  // 最后从数据库提取查询到的完整信息并附上权重
  for (id in combineRes.rank) {
    let cloudRes = await db.collection(collection)
    .field({ 
      _id: true,
      _openid: true,
      address: true,
      avatarUrl: true,
      bgImgUrl: true,
      birthDate: true,
      contactArray: true,
      degreeArray: true,
      gender: true,
      homeTown: true,
      intro: true,
      jobArray: true,
      nickName: true,
      phoneNumber: true,
      realName: true,
      wechatId: true,
    }).where({ _id: id }).get();
    if (cloudRes.data !== undefined) {
      let tmpItem = cloudRes.data[0];
      tmpItem.keyFound = combineRes.keyFound[id];
      tmpItem.rank = combineRes.rank[id];
      final.push(tmpItem);
    }
  }

  // 按照权重排个序
  final.sort((x, y) => {
    return y.rank - x.rank;
  });

  return final;
}


// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    let { start, limit, requestArray, pageLength, collection } = event;

    let searchRes = await searchMain(collection, requestArray);

    total = searchRes.length;

    // 这个是用来分页用的
    if (pageLength !== undefined && start != undefined && total > pageLength ) {
      searchRes = searchRes.slice(start, start + pageLength);
      start += pageLength;
    }

    // limit是用来选取前n个的
    if (limit != undefined) {
      searchRes = searchRes.slice(0, limit);
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
      err: error.message
    }
  }

}