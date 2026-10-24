# main.py —— 按 F5 选择“运行当前 Python 文件”，或在终端里 python main.py
numbers = [5, 3, 9, 1, 7, 2, 8]
even_squared = [x * x for x in numbers if x % 2 == 0]

print("hello, VS Code + Python")
print(f"原始数据: {numbers}")
print(f"偶数平方: {even_squared}")

words = ["computer", "organization", "memory", "decoder"]
print("按长度排序:", sorted(words, key=len))
