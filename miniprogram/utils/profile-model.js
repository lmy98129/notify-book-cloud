const initValue = {
  nickName: {
    name: "昵称"
  },
  realName: {
    name: "真实姓名"
  },
  gender: {
    name: "性别"
  },
  address: {
    name: "现住址"
  },
  wechatId: {
    name: "微信"
  },
  phoneNumber: {
    name: "手机号"
  },
  institution: {
    name: "工作单位"
  },
  job: {
    name: "职务名称"
  },
  contactType: {
    name: "类型",
  },
  content: {
    name: "内容"
  },
  jobStartTime: {
    name: "入职时间",
    default: "请选择入职时间"
  },
  jobEndTime: {
    name: "离职时间",
    default: "请选择离职时间"
  },
  birthDate: {
    name: "生日",
    default: "请选择日期"
  },
  homeTown: {
    name: "籍贯",
    default: "请选择籍贯"
  },
  school: {
    name: "学院",
  },
  degree: {
    name: "学历",
    default: "请选择学历"
  },
  major: {
    name: "专业"
  },
  degreeStartTime: {
    name: "入学时间",
    default: "请选择入学时间"
  },
  degreeEndTime: {
    name: "毕业时间",
    default: "请选择毕业时间"
  },
  intro: {
    name: "自我介绍"
  },
  headteacher: {
    name: "班主任"
  }
}

const userInfo = {
  nickName: "",
  realName: "",
  gender: "",
  birthDate: "请选择日期",
  homeTown: "请选择籍贯",
  address: "",
  wechatId: "",
  phoneNumber: "",
  jobArray: [{
    institution: "",
    job: "",
    jobStartTime: "请选择入职时间",
    jobEndTime: "请选择离职时间"
  }],
  contactArray: [{
    contactType: "",
    content: ""
  }],
  degreeArray: [{
    degree: "请选择学历",
    school: "",
    major: "",
    headteacher: "",
    degreeStartTime: "请选择入学时间",
    degreeEndTime: "请选择毕业时间",
  }],
  intro: ""
}

module.exports = {
  initValue,
  userInfo,
}