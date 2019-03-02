// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require("tcb-router");
const XLSX = require("xlsx");

cloud.init()

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const app = new TcbRouter({ event });

  app.router("uploadProfile", async (ctx) => {
    try {
      let { profile, collection, _id } = event;

      let updateRes = await db.collection(collection).doc(_id).update({
        data: profile
      });

      ctx.body = {
        code: 1,
        updateRes,
      } 
    } catch (error) {
      console.log(error)
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("uploadAvatar", async (ctx) => {
    try {
      let { avatarUrl, collection, _id, isAvatarCustomed } = event;
      if (isAvatarCustomed === "true") {
        isAvatarCustomed = true;
      } else if (isAvatarCustomed === "false") {
        isAvatarCustomed = false;
      }

      let updateRes = await db.collection(collection).doc(_id).update({
        data: {
          avatarUrl,
          isAvatarCustomed,
        }
      })

      ctx.body = {
        code: -1,
        updateRes
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("uploadBgImg", async (ctx) => {
    try {
      let { bgImgUrl, collection, _id, isBgImgCustomed } = event;
      if (isBgImgCustomed === "true") {
        isBgImgCustomed = true;
      } else if (isBgImgCustomed === "false") {
        isBgImgCustomed = false;
      }
      let updateRes = await db.collection(collection).doc(_id).update({
        data: {
          bgImgUrl,
          isBgImgCustomed
        }
      })
      ctx.body = {
        code: 1,
        updateRes
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("deleteProfile", async (ctx) => {
    try {
      let { _id, collection } = event;

      let deleteRes = await db.collection(collection).doc(_id).remove();

      ctx.body = {
        code: 1,
        deleteRes
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })
  
  app.router("uploadIntro", async (ctx) => {
    try {
      let { _id, collection, intro } = event;

      let updateRes = await db.collection(collection).doc(_id).update({
        data: { intro }
      })

      ctx.body = {
        code: 1,
        updateRes
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("addProfile", async (ctx) => {
    try {
      let { profile, collection } = event;

      let addRes = await db.collection(collection).add({ data: profile });

      ctx.body = {
        code: 1,
        addRes,
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("getImportDocuments", async (ctx) => {
    try {
      let cloudRes = await db.collection("import-list").get();

      ctx.body = {
        code: 1,
      }
      
      if (cloudRes.data) {
        ctx.body.data = cloudRes.data;
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("deleteImportDocuments", async (ctx) => {
    try {
      let { fileList } = event;

      await cloud.deleteFile({
        fileList,
      })

      for (document of fileList) {
        await db.collection("import-list").where({ document }).remove();
      }

      ctx.body = {
        code: 1,
      }
      
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("getExcelSheetNames", async (ctx) => {
    try {
      let { fileID } = event;

      let downloadRes = await cloud.downloadFile({
        fileID,
      })

      const buffer = downloadRes.fileContent;

      const workbook = XLSX.read(buffer, { type: "buffer" });

      const sheetNames = workbook.SheetNames;
      
      ctx.body = {
        code: 1,
        sheetNames,
      }
      
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("getHeaderColumns", async (ctx) => {
    try {
      let { startCol, endCol, row, range, sheetName, fileID } = event;
  
      let downloadRes = await cloud.downloadFile({
        fileID,
      })
  
      const buffer = downloadRes.fileContent;
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[sheetName];
  
      worksheet["!ref"] = range;
  
      let cols = [];
      if (typeof startCol !== "string" || typeof endCol !== "string" || endCol < startCol) {
        ctx.body = {
          code: -1,
        }
        return;
      }
      let length = endCol.toUpperCase().charCodeAt(0) - startCol.toUpperCase().charCodeAt(0) + 1;
      for (let i=0; i< length; i++) {
        cols.push(worksheet[String.fromCharCode(startCol.toUpperCase().charCodeAt(0) + i) + row].v);
      }
      ctx.body = {
        code: 1,
        cols
      }
      
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("getXLSXJson", async (ctx) => {
    try {
      let { range, selectedSheets, fileID } = event;
  
      let downloadRes = await cloud.downloadFile({
        fileID,
      })
  
      const buffer = downloadRes.fileContent;
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let worksheet, json = [];
      
      for (sheetName of selectedSheets) {
        worksheet = workbook.Sheets[sheetName];
        worksheet["!ref"] = range;
        json = json.concat(XLSX.utils.sheet_to_json(worksheet));
      }

      ctx.body = {
        code: 1,
        json,
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("importData", async (ctx) => {
    try {
      let { importData,  collection } = event;
      
      for (data of importData) {
        await db.collection(collection).add({ data });
      }
      
      ctx.body = {
        code: 1,
      }
      
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("exportData", async (ctx) => {
    try {
      let { json, header } = event;
      const newWorkBook = { SheetNames: ['Sheet1'], Sheets: {}, Props: {} };
      newWorkBook.Sheets['Sheet1']  = XLSX.utils.json_to_sheet(json, { header });
      let fileContent = XLSX.write(newWorkBook, { type: "buffer" });
      let cloudPath = "export/导出-" + (new Date()).getTime() + ".xlsx";
      let uploadFileRes = await cloud.uploadFile({
        cloudPath,
        fileContent
      })
      let { fileID } = uploadFileRes;
      ctx.body = {
        code: 1,
        fileID,
      }
    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error
      }
    }
  })

  app.router("classInfoDownload", async (ctx) => {
    try {
      ctx.body = {
        code: 1,
      }

      let downloadRes = [], classNameArray = [];

      let countRes = await db.collection("class-info").count();

      let { total } = countRes;

      if (total > 100) {
        let skip = 0;
        while(skip <= total) {
          let cloudRes = await db.collection("class-info").skip(skip).limit(100).get();
          if (cloudRes.data !== undefined) {
            downloadRes = downloadRes.concat(cloudRes.data);
            skip += 100;
          }
        }
      } else {
        let cloudRes = await db.collection("class-info").get();
        if (cloudRes.data !== undefined) {
          downloadRes = cloudRes.data;
        }
      }

      ctx.body.data = downloadRes;

      for (item of downloadRes){
        classNameArray.push(item.className);
      }

      ctx.body.classNameArray = classNameArray;

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("classInfoAdd", async (ctx) => {
    try {
      let { newClassInfo } = event;

      let addRes = await db.collection("class-info").add({ data: newClassInfo });

      ctx.body = {
        code: 1,
        addRes
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("classInfoUpdate", async (ctx) => {
    try {
      let { newClassInfo, _id } = event;

      let updateRes = await db.collection("class-info").doc(_id).update({ data: newClassInfo });

      ctx.body = {
        code: 1,
        updateRes
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("classInfoDelete", async (ctx) => {
    try {
      let { selected } = event;

      let deleteRes = [];

      for (id of selected) {
        console.log(id);
        deleteRes.push(await db.collection("class-info").doc(id).remove())
      }

      ctx.body = {
        code: 1,
        deleteRes
      }

    } catch (error) {
      console.log(error);
      ctx.body = {
        code: -1,
        err: error.message
      }
    }
  })

  app.router("findProfile", async (ctx) => {
    try {
      ctx.body = {
        code: 1,
      }

      let { realName, collection } = event;

      let cloudRes = await db.collection(collection).where({
        realName,
        _openid: { $exists: false }
      }).get();

      if (cloudRes.data) {
        ctx.body.data = cloudRes.data;
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