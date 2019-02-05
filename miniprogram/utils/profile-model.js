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
  className: {
    name: "班级"
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
    className: "",
    headteacher: "",
    degreeStartTime: "请选择入学时间",
    degreeEndTime: "请选择毕业时间",
  }],
  intro: ""
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
  initValue,
  userInfo,
  columnRank
}