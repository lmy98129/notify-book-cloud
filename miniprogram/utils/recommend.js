const db = wx.cloud.database();
const app = getApp();
import regeneratorRuntime, { async } from "./regenerator-runtime/runtime";
const profile = require("./profile");

module.exports = {
  possibleKnow: async () => {
    try {
      let res = await profile.download();
      let recList = [];
      if (res.code !== 2) {
        return recList;
      } else {
        let userInfo = res.data;
        let requestArray = [
          {
            text: userInfo.enterSchoolTime.slice(0,4),
            keyArray: [
              "enterSchoolTime",
            ],
            weight: 4,
          },
          {
            text: userInfo.homeTown.slice(0,3),
            keyArray: [
              "homeTown",
            ],
            weight: 4
          },
          {
            text: userInfo.institution,
            keyArray: [
              "institution",
            ],
            weight: 3
          },
          {
            text: userInfo.major,
            keyArray: [
              "major",
            ],
            weight: 4
          },

          {
            text: userInfo.degree,
            keyArray: [
              "degree"
            ],
            weight: 2,
          },
          {
            text: userInfo.birthDate.slice(0,4),
            keyArray: [
              "birthDate",
            ],
            weight: 3,
          },
        ];
        for (let item of userInfo.jobArray) {
          requestArray.push({
            text: item.job,
            keyArray: [
              "job",
            ],
            weight: 3
          }),
          requestArray.push({
            text: item.jobStartTime.slice(0,4),
            keyArray: [
              "jobStartTime",
            ],
            weight: 2
          })
        }
        res = await wx.cloud.callFunction({
          name: "search",
          data: {
            text: "recommend",
            start: 0,
            pageLength: 9,
            requestArray,
            collection: "profile"
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
      }
      
    } catch (error) {
      console.log(error);
      return recList;
    }
  },
  same: async (sameKey) => {
    try {
      let res = await profile.download();
      let recList = [];
      if (res.code !== 2) {
        return recList;
      } else {
        let userInfo = res.data;
        let requestArray = [
          {
            text: userInfo[sameKey].slice(0,4),
            keyArray: [
              sameKey,
            ],
            weight: 4,
          },
        ]
        res = await wx.cloud.callFunction({
          name: "search",
          data: {
            text: "recommend",
            start: 0,
            pageLength: 10,
            requestArray,
            collection: "profile"
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
      }
    } catch (error) {
      console.log(error);
      return recList;
    }
  }
}