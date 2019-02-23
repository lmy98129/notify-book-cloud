// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require("tcb-router");

cloud.init()

const db = cloud.database();
const _ = db.command;

const field = { 
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
};

// 增加记录的权重
const increase = (data, final, weight, key) => {
  for (item of data) {
    let i = final.findIndex((x) => x._id === item._id);
    if (i < 0) {
      item.rank = weight;
      item.keyFound = [];
      item.keyFound.push(key);
      final.push(item);
    } else {
      final[i].rank += weight;
      final[i].keyFound.push(key);
    }
  }
}

const search = async (collection, text, weightArray) => {
  // rank用于计算当前记录的总权重
  // keyFound用于存储当前记录中涉及的键
  let final = [];
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
      case "headteacher":
      case "major":
      case "school":
      case "className":
        arrayType = "degreeArray";
        break;
      default:
        break;
    }
    // 拼装查询条件query
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
        authStatus: "authorized", 
        isProfileEmpty: false
      }
    } else {
      query = {
        [key]: db.RegExp({
          regexp: text,
          options: "im",
        }),
        authStatus: "authorized", 
        isProfileEmpty: false
      }
    }
    // 进行实际查询
    let skip = 0, searchRes = [];
    let totalRes = await db.collection(collection).where(query).count();
    total = totalRes.total;
    console.log("total: ", total);
    // 若总数已经超过100
    if (total >= 100) {
      while (skip <= total) {
        let cloudRes = await db.collection(collection).
          skip(skip).limit(100).field(field).where(query).get();
        if (cloudRes.data !== undefined) {
          searchRes = searchRes.concat(cloudRes.data);
          skip += 100;
        }
      }
      console.log("final length: ", searchRes.length);
    // 若总数未超过100
    } else if (total > 0){
      let cloudRes = await db.collection(collection)
        .limit(100).field(field).where(query).get();
      if (cloudRes.data !== undefined) {
        searchRes = searchRes.concat(cloudRes.data);
      }
    }
    // 如果没有出现空且长度大于0，增加权重
    if (searchRes.length > 0) {
      increase(searchRes, final, weightArray[key], key);
    }
  }
  
  return final;
}

// 合并不同查询内容的权重
const combine = (res1, res2) => {
  for (index2 in res2) {
    let index1 = res1.findIndex((x) => x._id === res2[index2]._id);
    // 若res2中有res1中已经存在的，则更新
    if (index1 >= 0) {
      res1[index1].keyFound = res1[index1].keyFound.concat(res2[index2].keyFound);
      res1[index1].rank += res2[index2].rank;
    // 若res2中有res1中不存在的，则增加
    } else {
      res1.push(res2[index2]);
    }
    // res1、res2中出现有/无的状态组合有4种，上面有三种
    // 其余的逻辑是：res1有而res2没有的，保持不变；res1和res2中均没有的，不用考虑
  }

  return res1;
}

const searchMain = async (collection, requestArray) => {
  // 查找
  let searchRes = [];

  console.time("search");
  for (request of requestArray) {
    let weightArray = [];
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
  console.timeEnd("search");

  console.time("combine");
  // 合并不同内容查找的结果
  let combineRes = searchRes[0]
  for (let i=1; i<searchRes.length; i++) {
    combineRes = combine(searchRes[i], combineRes);
  }
  console.timeEnd("combine");

  // 按照权重排个序
  combineRes.sort((x, y) => {
    return y.rank - x.rank;
  });

  return combineRes;
}


// 云函数入口函数
exports.main = async (event, context) => {
  const app = new TcbRouter({ event });
  const wxContext = cloud.getWXContext();

  app.router("search", async (ctx) => {
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
  
      ctx.body = {
        code: 1,
        searchRes,
        start,
        total
      }
      
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("manage", async (ctx) => {
    try {
      let { query, start, limit, pageLength, collection } = event;
      let searchRes = [], total;

      console.log(query);
      if (typeof query === "string") {
        switch(query) {
          case "ALL":
            if (start !== undefined && pageLength !== undefined){
              let countRes = await db.collection(collection).count();
              total = countRes.total;
              if (pageLength >= 100) {
                let skip = 0;
                while (skip <= pageLength) {
                  let cloudRes = await db.collection(collection).
                    skip(start+skip).limit(100).field(field).get();
                  if (cloudRes.data !== undefined) {
                    searchRes = searchRes.concat(cloudRes.data);
                    skip += 100;
                  }
                }
              } else {
                cloudRes = await db.collection(collection).skip(start).limit(pageLength).field(field).get();
                if (cloudRes.data !== undefined) {
                  searchRes = cloudRes.data;
                }
              }
            }
            break;
        }
      } else if (typeof query === "object") {
        let countRes = await db.collection(collection).where(query).field(field).count();
        total = countRes.total;
        if (pageLength >= 100) {
          let skip = 0;
          while(skip <= pageLength) {
            let cloudRes = await db.collection(collection).where(query)
              skip(start+skip).limit(100).field(field).get();
            if (cloudRes.data !== undefined) {
              searchRes = searchRes.concat(cloudRes.data);
              skip += 100;
            }
          }
        } else {
          cloudRes = await db.collection(collection).where(query).skip(start).limit(pageLength).field(field).get();
          if (cloudRes.data !== undefined) {
            searchRes = cloudRes.data
          }
        }
      }

      if (limit != undefined) {
        searchRes = searchRes.slice(0, limit);
      }

      ctx.body = {
        code: 1,
        searchRes,
        start,
        total
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  return app.serve();

}