const SCHEMA = {
  _id: {
    type: "string",
    default: "",
    required: true,
  },
  _openid: {
    type: "string",
    default: "",
    required: true,
  },
  avatarUrl: {
    type: "string",
    default: "",
    required: true,
  },
  bgImgUrl: {
    type: "string",
    default: "",
    required: true,
  },
  address: {
    type: "string",
    default: "",
    required: false,
    name: "现住址",
  },
  birthDate: {
    type: "string",
    default: "",
    required: true,
    name: "生日",
    placeHolder: "请选择日期",
  },
  nickName: {
    type: "string",
    default: "",
    required: true,
    name: "昵称",
  },
  realName: {
    type: "string",
    default: "",
    required: true,
    name: "真实姓名",
  },
  gender: {
    type: "string",
    default: "男",
    required: true,
    name: "性别"
  },
  homeTown: {
    type: "string",
    default: "",
    required: true,
    name: "籍贯",
    placeHolder: "请输入籍贯",
  },
  phoneNumber: {
    type: "string",
    default: "",
    required: true,
    name: "手机号",
  },
  eMail: {
    type: "string",
    default: "",
    required: true,
    name: "E-mail"
  },
  wechatId: {
    type: "string",
    default: "",
    required: false,
    name: "微信号"
  },
  intro: {
    type: "string",
    default: "",
    required: true,
    name: "自我介绍",
  },
  contactArray: {
    type: "Array",
    default: [],
    required: false,
    name: "联系方式",
    itemType: {
      contactType: {
        type: "string",
        default: "",
        required: true,
        name: "类型"
      },
      content: {
        type: "string",
        default: "",
        required: true,
        name: "内容"
      }
    }
  },
  degreeArray: {
    type: "Array",
    default: [],
    required: true,
    name: "学历信息",
    itemType: {
      degree: {
        type: "string",
        default: "",
        required: true,
        name: "学历",
        placeHolder: "请选择学历",
      },
      school: {
        type: "string",
        default: "电视学院",
        required: true,
        name: "学院"
      },
      college: {
        type: "string",
        default: "中国传媒大学",
        required: true,
        name: "学校",
      },
      headteacher: {
        type: "string",
        default: "",
        required: true,
        name: "班主任"
      },
      className: {
        type: "string",
        default: "",
        required: true,
        name: "班级",
        placeHolder: "请选择班级",
      },
      major: {
        type: "string",
        default: "",
        required: true,
        name: "专业",
      },
      degreeStartTime: {
        type: "string",
        default: "",
        required: true,
        name: "入学时间",
        placeHolder: "请选择入学时间"
      },
      degreeEndTime: {
        type: "string",
        default: "",
        required: false,
        name: "毕业时间",
        placeHolder: "请选择毕业时间",
      },
    }
  },
  jobArray: {
    type: "Array",
    default: [],
    required: true,
    name: "工作职务",
    itemType: {
      institution: {
        type: "string",
        default: "",
        required: true,
        name: "工作单位",
      },
      job: {
        type: "string",
        default: "",
        required: true,
        name: "职务名称",
      },
      jobStartTime: {
        type: "string",
        default: "",
        required: true,
        name: "入职时间",
        placeHolder: "请选择入职时间",
      },
      jobEndTime: {
        type: "string",
        default: "",
        required: true,
        name: "离职时间",
        placeHolder: "请选择离职时间",
      }
    }
  },
}

const ignore = ['_id', '_openid', 'avatarUrl', 'bgImgUrl'];

// 生成资料模板
const profileModelGenerator = (schema, ignore) => {
  let newObj = {};
  for (let key in schema) {
    if (ignore.indexOf(key) >= 0) {
      continue;
    } else if (schema[key].type !== "Array") {
      if (schema[key].placeHolder !== undefined) {
        newObj[key] = schema[key].placeHolder;
      } else {
        newObj[key] = schema[key].default;
      }
    } else {
      let newItemObj = {};
      for (let subKey in schema[key].itemType) {
        if (schema[key].itemType[subKey].placeHolder !== undefined) {
          newItemObj[subKey] = schema[key].itemType[subKey].placeHolder;
        } else {
          newItemObj[subKey] = schema[key].itemType[subKey].default;
        }
      }
      newObj[key] = [newItemObj];
    }
  }
  return newObj;
}


const rank = [
  "degreeArray",
  "jobArray",
  "contactArray",
  "nickName",
  "realName",
  "gender",
  "birthDate",
  "homeTown",
  "address",
  "phoneNumber",
  "wechatId",
  "eMail",
]

// 生成检索用的字段表
const searchFieldGenerator = (schema, rank) => {
  let searchField = {};
  searchField.searchColumn = { searchColumnKey: rank };
  let searchColumnItem = []
  for (let key of rank) {
    if (schema[key] && schema[key].name !== undefined) {
      searchColumnItem.push(schema[key].name);
    }
  }
  searchField.searchColumn.searchColumnItem = searchColumnItem;
  for (let key in schema) {
    if (schema[key].type === "Array") {
      let itemArray = `${key}Item`, keyArray = `${key}Key`;
      searchField[key] = {
        [itemArray]: [],
        [keyArray]: [],
      };
      for (let subKey in schema[key].itemType) {
        searchField[key][itemArray].push(schema[key].itemType[subKey].name);
        searchField[key][keyArray].push(subKey);
      }
    }
  }
  return searchField;
}

const initValueGenerator = (schema, ignore) => {
  let initValue = {};
  for (let key in schema) {
    if (ignore.indexOf(key) >= 0) {
      continue;
    } else if (schema[key].type !== "Array") {
      let { name } = schema[key];
      initValue[key] = { name };
      if (schema[key].placeHolder !== undefined &&
        schema[key].placeHolder !== "") {
        initValue[key].default = schema[key].placeHolder;
      }
    } else {
      for (let subKey in schema[key].itemType) {
        let { name } = schema[key].itemType[subKey];
        initValue[subKey] = { name };
        if (schema[key].itemType[subKey].placeHolder !== undefined && 
          schema[key].itemType[subKey].placeHolder !== "") {
          initValue[subKey].default = schema[key].itemType[subKey].placeHolder;
        }
      }
    }
  }
  return initValue;
}

const defaultAllow = [ 'realName', 'degreeArray' ];

const permissionGenerator = (schema, ignore, defaultAllow) => {
  ignore.push('intro');
  let permission = { isShowUserInfo: {} };
  for (let key in schema) {
    if (ignore.indexOf(key) >= 0) {
      continue;
    } else if (schema[key].type === 'Array') {
      let newKey = key.replace(key[0], key[0].toUpperCase());
      if (defaultAllow.indexOf(key) >= 0) {
        permission[`isShow${newKey}`] = true;
      } else {
        permission[`isShow${newKey}`] = false;
      }
    } else {
      if (defaultAllow.indexOf(key) >= 0) {
        permission.isShowUserInfo[key] = true;
      }
    }
  }
  return permission;
}

const PERMISSION_STATUS = { ALL: 'ALL', SAME_CLASS: 'SAME_CLASS', ALL_NOT: 'ALL_NOT' }

const permissionSettingGenerator = (schema, ignore, defaultAllow) => {
  let permissionSetting = {};
  ignore.push('intro');
  for (let key in schema) {
    if (ignore.indexOf(key) >= 0) {
      continue;
    } else if (defaultAllow.indexOf(key) >= 0) {
      permissionSetting[key] = PERMISSION_STATUS.ALL;
    } else {
      permissionSetting[key] = PERMISSION_STATUS.ALL_NOT;
    }
  }
  return permissionSetting;
}

const adminPermissionGenerator = (schema, ignore) => {
  ignore.push('intro');
  let permission = { isShowUserInfo: {} };
  for (let key in schema) {
    if (ignore.indexOf(key) >= 0) {
      continue;
    } else if (schema[key].type === 'Array') {
      let newKey = key.replace(key[0], key[0].toUpperCase());
      permission[`isShow${newKey}`] = true;
    } else {
      permission.isShowUserInfo[key] = true;
    }
  }
  return permission;
}

const columnRank = [
  {
    key: "realName",
    col: "真实姓名",
    checked: true,
  },
  {
    key: "nickName",
    col: "昵称",
    checked: true
  },
  {
    key: "gender",
    col: "性别",
    checked: true
  },
  {
    key: "degreeArray",
    col: "学历信息",
    checked: true
  },
  {
    key: "phoneNumber",
    col: "手机号",
    checked: true
  },
  {
    key: "wechatId",
    col: "微信号",
  },
  {
    key: "contactArray",
    col: "联系方式"
  },
  {
    key: "jobArray",
    col: "工作职务"
  },
  {
    key: "birthDate",
    col: "生日"
  },
  {
    key: "homeTown",
    col: "籍贯"
  },
  {
    key: "address",
    col: "现住址"
  },
]

module.exports = {
  initValue: initValueGenerator(SCHEMA, ignore),
  userInfo: profileModelGenerator(SCHEMA, ignore),
  columnRank,
  searchField: searchFieldGenerator(SCHEMA, rank),
  permission: permissionGenerator(SCHEMA, ignore, defaultAllow),
  adminPermission: adminPermissionGenerator(SCHEMA, ignore),
  permissionSetting: permissionSettingGenerator(SCHEMA, ignore, defaultAllow),
  PERMISSION_STATUS,
  SCHEMA,
}