// 01_mongosh_basics.js  —  mongosh 基础练习（非结构化数据库）
// 运行：mongosh mongodb://127.0.0.1:27017/school --file 01_mongosh_basics.js
// 要点：文档型、无固定表结构、字段可以缺失/嵌套/是数组

// ---------- 0. 库与集合 ----------
// 集合不存在时，第一次写入会自动创建
db = db.getSiblingDB('school')     // --file 脚本里用 getSiblingDB 切换库最稳
db.dropDatabase()                  // 每次重跑都从干净状态开始

// ---------- 1. 插入：同一个集合里文档结构可以不一样 ----------
db.students.insertMany([
  { _id: 'S001', name: '李梦洋', grade: 2024, major: '数据科学与大数据技术',
    skills: ['Python', 'Java', 'MongoDB'],
    contact: { email: 'lm@stu.edu.cn', phone: '138****0000' },        // 嵌套子文档
    scores: { '高等数学': 88, '数据结构': 92 } },                        // 动态键
  { _id: 'S002', name: '王小明', grade: 2024, major: '数据科学与大数据技术',
    skills: ['C++'], contact: { email: 'wxm@stu.edu.cn' } },           // 没有 scores 字段
  { _id: 'S003', name: '张小红', grade: 2023, major: '软件工程',
    skills: ['Python', 'Go'],
    contact: { email: 'zxh@stu.edu.cn' }, scores: { '高等数学': 76 } },
])
db.students.insertOne({ _id: 'S004', name: '陈七', tags: ['转专业', '交换生'],  // 数组字段
                        extra: { gpa: 3.6, semester: 5 } })

// ---------- 2. 查询 ----------
db.students.find()                                                  // 全部
db.students.find({ grade: 2024 })                                   // 等值
db.students.find({ 'contact.email': /^lm/ })                        // 点号查嵌套 + 正则
db.students.find({ skills: 'Python' })                              // 数组包含匹配（不用写数组下标）
db.students.find({ skills: { $all: ['Python', 'Go'] } })            // 同时含两个
db.students.find({ 'scores.高等数学': { $gte: 80 } })
db.students.find({ scores: { $exists: false } }, { name: 1, _id: 0 })  // 字段是否存在：无 schema 的关键
db.students.find({}, { name: 1, 'contact.email': 1, _id: 0 })      // 投影

db.students.countDocuments({ grade: 2024 })
db.students.findOne({ _id: 'S001' })

// ---------- 3. 更新 ----------
db.students.updateOne({ _id: 'S002' }, { $set: { 'contact.phone': '139****1111' } })  // 只加不改别的
db.students.updateOne({ _id: 'S001' }, { $push: { skills: 'Spark' } })                 // 往数组追加
db.students.updateOne({ _id: 'S001' }, { $set: { 'scores.数据库原理': 90 } })               // 新增一门课的成绩
db.students.updateMany({ grade: 2024 }, { $set: { status: '在读' } })
db.students.updateOne({ _id: 'S004' }, { $pull: { tags: '交换生' } })                   // 从数组删除
db.students.replaceOne({ _id: 'S003' }, { _id: 'S003', name: '张小红', grade: 2023,
                        major: '软件工程', remark: '整篇替换：未写出的字段会消失' })
db.students.find({ _id: 'S003' })

// ---------- 4. 删除 ----------
db.students.deleteOne({ _id: 'S004' })
db.students.deleteMany({ grade: { $lt: 2023 } })

// ---------- 5. 索引 ----------
db.students.createIndex({ grade: 1, major: -1 })            // 复合索引
db.students.createIndex({ 'contact.email': 1 }, { unique: true })
db.students.getIndexes()
db.students.find({ grade: 2024 }).explain('queryPlanner').queryPlanner.winningPlan

// ---------- 6. 关联建模：内嵌 vs 引用 ----------
// 一对一/一对少 → 内嵌（读一次就够）；量大或独立更新 → 引用（$lookup 关联）
db.courses.insertMany([
  { _id: 'C101', title: '非结构化数据库', credit: 3, teacher: '赵老师' },
  { _id: 'C102', title: '大数据存储与处理', credit: 4, teacher: '钱老师' },
])
db.enrollments.insertMany([
  { sid: 'S001', cid: 'C101', term: '2026秋', score: 92 },
  { sid: 'S001', cid: 'C102', term: '2026秋', score: 85 },
  { sid: 'S002', cid: 'C101', term: '2026秋', score: 78 },
  { sid: 'S003', cid: 'C102', term: '2026秋', score: 90 },
])

// ---------- 7. 聚合管道（MongoDB 的“SQL group by”）----------
db.enrollments.aggregate([
  { $match: { term: '2026秋' } },
  { $group: { _id: '$cid', avg: { $avg: '$score' }, max: { $max: '$score' }, n: { $sum: 1 } } },
  { $sort: { avg: -1 } },
]).toArray()

db.enrollments.aggregate([
  { $lookup: { from: 'courses', localField: 'cid', foreignField: '_id', as: 'course' } },
  { $unwind: '$course' },
  { $project: { _id: 0, 学生: '$sid', 课程: '$course.title', 成绩: '$score' } },
]).toArray()

// 学生最高分课程
db.students.aggregate([
  { $match: { skills: { $exists: true } } },
  { $unwind: '$skills' },
  { $group: { _id: '$_id', 技能数: { $sum: 1 }, 技能: { $push: '$skills' } } },
  { $sort: { 技能数: -1 } },
]).toArray()

// ---------- 8. 用户与权限（了解即可）----------
// db.createUser({ user: 'stu', pwd: '123456', roles: [{ role: 'read', db: 'school' }] })

print('mongosh 练习脚本执行完毕：' + db.students.countDocuments() + ' 条学生记录')
