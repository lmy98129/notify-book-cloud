const app = getApp();

import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";

const decode = (result) => {
  let { searchRes } = result;
  let removeItem = ["_id", "_openid", "intro", "bgImgUrl"];
  wx.setStorage({ key: "profileManageDataTmp", data: searchRes});
  for(let profile of searchRes ) {
    for (let item of removeItem) {
      delete profile[item]
    }
  }
}

const download = async (start, pageLength) => {
  try {
    let manageRes = await wx.cloud.callFunction({
      name: "search",
      data: {
        $url: "manage",
        collection: "profile-test",
        query: "ALL",
        start,
        pageLength,
      }
    });
    
    if (manageRes.result !== undefined) {
      switch(manageRes.result.code) {
        case 1:
          let result = manageRes.result;
          decode(result);
          return {
            code: 1,
            result
          }
          break;
        case -1:
          return {
            code: -1,
            err: manageRes.result.err
          }
          break;
      }
    } else {
      return {
        code: -1
      }
    }
    
  } catch (error) {
    console.log(error);
    return {
      code: -1,
      err: error.message
    }
  }
}

module.exports = {
  decode,
  download,
}