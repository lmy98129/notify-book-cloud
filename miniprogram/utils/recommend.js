const db = wx.cloud.database();
const app = getApp();
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";
const profile = require("./profile");

module.exports = {
  possibleKnow: async () => {
    try {
      let curUserProfile = await profile.check();
      let requestArray = [], recList = [],
        arrayNames = ["jobArray", "contactArray", "degreeArray"];
      for (let item in curUserProfile) {
        let text, value;
        switch(item) {
          case "address":
            text = curUserProfile[item];
            value = 4;
            break;
          case "homeTown":
            text = curUserProfile[item].slice(0, 3);
            value = 4;
            break;
          case "birthDate":
            text = curUserProfile[item].slice(0, 4);
            value = 3;
            break;
          case "jobArray":
            for (let job of curUserProfile.jobArray) {
              for (let subItem in job) {
                let text, value;
                switch(subItem) {
                  case "job":
                  case "institution":
                    text = job[subItem];
                    value = 3;
                    break;
                  case "jobStartTime":
                    text = job[subItem].slice(0, 4);
                    value = 3;
                    break;
                }
                if (text !== undefined && value !== undefined) {
                  requestArray.push({ text,
                    weight: [{ value, keyArray: [subItem] }]
                  });
                }
              }
            }
            break;
          case "degreeArray":
            for (let degree of curUserProfile.degreeArray) {
              for (let subItem in degree) {
                let text, value;
                switch(subItem) {
                  case "degree":
                  case "major":
                  case "school":
                  case "className":
                    text = degree[subItem];
                    value = 4;
                    break;
                  case "headteacher":
                    text = degree[subItem];
                    value = 3;
                    break;
                  case "degreeStartTime":
                    text = degree[subItem].slice(0, 4);
                    value = 3;
                    break;
                }
                if (text !== undefined && value !== undefined) {
                  requestArray.push({ text,
                    weight: [{ value, keyArray: [subItem] }]
                  });
                }
              }
            }
            break;
        }
        if (arrayNames.indexOf(item) < 0 && text !== undefined && value !== undefined) {
          requestArray.push({ text,
            weight: [{ value, keyArray: [item] }]
          });
        }
      }

      let res = await wx.cloud.callFunction({
        name: "search",
        data: {
          $url: "search",
          start: 0,
          pageLength: 9,
          requestArray,
          collection: "profile-new"
        }
      });
      if (res.result.code === 1) {
        recList = res.result.searchRes;
        let openid = app.globalData.openid;
        for (let i=0; i<recList.length; i++) {
          if (recList[i]._openid === openid) {
            recList.splice(i,1);
          }
        }
      } 
      return recList;
      
    } catch (error) {
      console.log(error);
      return recList;
    }
  },
  same: async (sameKey) => {
    try {
      let curUserProfile = await profile.check();
      let recList = [], requestArray = [];
      for (let degree of curUserProfile.degreeArray) {
        let text, value;
        if (sameKey == "degreeStartTime") {
          text = degree[sameKey].slice(0, 4);
          value = 4;
        } else {
          text = degree[sameKey];
          value = 4;
        }
        requestArray.push({ text,
          weight: [{ value, keyArray: [sameKey] }]
        });
      }

      let res = await wx.cloud.callFunction({
        name: "search",
        data: {
          $url: "search",
          start: 0,
          pageLength: 10,
          requestArray,
          collection: "profile-new"
        }
      });
      if (res.result.code === 1) {
        recList = res.result.searchRes;
        let openid = app.globalData.openid;
        for (let i=0; i<recList.length; i++) {
          if (recList[i]._openid === openid) {
            recList.splice(i,1);
          }
        }
      } 
      return recList;
    } catch (error) {
      console.log(error);
      return recList;
    }
  }
}