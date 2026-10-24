"""模板：pymongo 脚本。改完直接按 F5 运行（或终端 python 文件名.py）"""
from pymongo import MongoClient

db = MongoClient("mongodb://127.0.0.1:27017/")["练习库"]     # ← 换成你自己的库名

# 第一次跑建数据
if db.students.count_documents({}) == 0:
    db.students.insert_many([
        {"no": "S001", "name": "李梦洋", "grade": 2024, "skills": ["Python", "MongoDB"],
         "scores": {"数据结构": 92, "高数": 88}},
        {"no": "S002", "name": "王小明", "grade": 2024, "skills": ["C++"],
         "scores": {"数据结构": 75}},
        {"no": "S003", "name": "张小红", "grade": 2023, "skills": ["Python", "Go"],
         "scores": {"数据结构": 81}},
    ])

# ==== 在这里写你的查询 ====
print("会 Python 的人：")
for d in db.students.find({"skills": "Python"}, {"_id": 0, "name": 1, "grade": 1}):
    print("  ", d)

# 聚合：字典字段先 $objectToArray 摊平再统计
print("各科均分：")
for row in db.students.aggregate([
    {"$project": {"s": {"$objectToArray": "$scores"}}},
    {"$unwind": "$s"},
    {"$group": {"_id": "$s.k", "均分": {"$avg": "$s.v"}, "人数": {"$sum": 1}}},
    {"$sort": {"均分": -1}},
    {"$project": {"_id": 0, "课程": "$_id", "均分": {"$round": ["$均分", 1]}, "人数": 1}},
]):
    print("  ", row)
