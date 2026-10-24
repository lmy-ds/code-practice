// 模板：mongosh 脚本。改完直接 Ctrl+Shift+B 运行
// 结果想看得清楚，用 print() / console.log()，不要只写表达式

db = db.getSiblingDB('练习库')     // ← 换成你自己的库名

// 第一次跑建数据，之后再跑就只查不插（按需删掉这段）
if (db.students.countDocuments() === 0) {
    db.students.insertMany([
        { no: 'S001', name: '李梦洋', grade: 2024, skills: ['Python', 'MongoDB'], scores: { 数据结构: 92, 高数: 88 } },
        { no: 'S002', name: '王小明', grade: 2024, skills: ['C++'], scores: { 数据结构: 75 } },
        { no: 'S003', name: '张小红', grade: 2023, skills: ['Python', 'Go'], scores: { 数据结构: 81 } },
    ])
}

// ==== 在这里写你的查询 ====
const 结果 = db.students.find({ skills: 'Python' }, { _id: 0, name: 1, grade: 1 }).toArray()
print('查到 ' + 结果.length + ' 条：')
结果.forEach(d => printjson(d))

// 聚合：scores 是「课程名: 分数」的字典，先用 $objectToArray 摊成数组才能统计
db.students.aggregate([
    { $project: { name: 1, s: { $objectToArray: '$scores' } } },
    { $unwind: '$s' },
    { $group: { _id: '$_id', 姓名: { $first: '$name' }, 均分: { $avg: '$s.v' } } },
    { $project: { _id: 0, 姓名: 1, 均分: { $round: ['$均分', 1] } } },
    { $sort: { 均分: -1 } },
]).toArray().forEach(d => printjson(d))    // 注意：别直接写 forEach(printjson)，它会多打印索引和数组
