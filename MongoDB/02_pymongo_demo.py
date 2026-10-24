"""02_pymongo_demo.py — 用 Python 操作 MongoDB（需 pymongo 4.x + 本地 MongoDB 服务）

运行：python 02_pymongo_demo.py
"""
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ServerSelectionTimeoutError

URI = "mongodb://127.0.0.1:27017/"
DB = "school_py"


def main() -> None:
    client = MongoClient(URI, serverSelectionTimeoutMS=3000)
    try:
        client.admin.command("ping")           # 连通性检查
    except ServerSelectionTimeoutError:
        raise SystemExit("连不上 127.0.0.1:27017 —— MongoDB 服务还没启动？")

    db = client[DB]
    print("服务器版本：", db.command("serverStatus")["version"])

    # 1. 建表 + 索引（集合无需预定义结构）
    students = db.students
    students.delete_many({})
    students.create_index([("grade", ASCENDING), ("major", DESCENDING)])
    students.create_index("student_no", unique=True)

    # 2. 批量插入：字段可以不一致，这就是“非结构化”
    students.insert_many([
        {"student_no": "S001", "name": "李梦洋", "grade": 2024,
         "major": "数据科学与大数据技术", "skills": ["Python", "MongoDB"],
         "contact": {"email": "lm@stu.edu.cn"}, "scores": {"数据结构": 92}},
        {"student_no": "S002", "name": "王小明", "grade": 2024,
         "major": "数据科学与大数据技术", "skills": ["C++"],
         "contact": {"email": "wxm@stu.edu.cn"}},                      # 没有 scores
        {"student_no": "S003", "name": "张小红", "grade": 2023,
         "major": "软件工程", "skills": ["Python", "Go"],
         "contact": {"email": "zxh@stu.edu.cn"}, "scores": {"数据结构": 81}},
    ])

    # 3. 查询：条件写法与 mongosh 完全一致，返回的是游标（惰性）
    print("\n[全部]")
    for doc in students.find({}, {"name": 1, "grade": 1, "_id": 0}).sort("student_no"):
        print("  ", doc)

    print("[嵌套 + 数组包含]")
    print("  ", students.find_one({"skills": "Python", "contact.email": {"$regex": "^z"}}))

    print("[字段缺失的判断]")
    print("  没有成绩的人：", [d["name"] for d in students.find({"scores": {"$exists": False}})])

    print("[统计]")
    print("  2024 级人数：", students.count_documents({"grade": 2024}))

    # 4. 更新：$set / $push / $inc / update_many
    students.update_one({"student_no": "S002"}, {"$set": {"scores": {"数据结构": 75}}})
    students.update_one({"student_no": "S001"}, {"$push": {"skills": "Spark"}})
    students.update_many({"grade": 2024}, {"$set": {"status": "在读"}})
    print("\n[S001 追加技能后]", students.find_one({"student_no": "S001"}, {"skills": 1, "_id": 0}))

    # 5. upsert：不存在就插入
    students.update_one({"student_no": "S999"},
                        {"$setOnInsert": {"name": "新同学", "grade": 2026}}, upsert=True)
    print("[upsert]", students.find_one({"student_no": "S999"}, {"_id": 0}))

    # 6. 聚合管道：$objectToArray 把动态键的字典摊平成 k/v，再分组统计
    agg = list(students.aggregate([
        {"$match": {"scores": {"$exists": True}}},
        {"$project": {"major": 1, "scores": {"$objectToArray": "$scores"}}},
        {"$unwind": "$scores"},
        {"$group": {"_id": {"major": "$major", "course": "$scores.k"},
                    "avg": {"$avg": "$scores.v"}, "n": {"$sum": 1}}},
        {"$sort": {"avg": -1}},
        {"$project": {"_id": 0, "专业": "$_id.major", "课程": "$_id.course",
                      "均分": {"$round": ["$avg", 1]}, "人数": "$n"}},
    ]))
    print("\n[聚合：按专业+课程求均分]")
    for row in agg:
        print("  ", row)

    # 7. 删除
    students.delete_one({"student_no": "S999"})
    print("\n删除后总数：", students.count_documents({}))

    # 8. 事务需要副本集（单机默认不支持），学习阶段先记住这点
    client.close()


if __name__ == "__main__":
    main()
