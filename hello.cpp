// hello.cpp —— 改完按 Ctrl+Shift+B 编译，再按 F5 调试运行
#include <format>
#include <iostream>
#include <ranges>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> names{"LiMengyang", "Computer Organization", "C++20"};

    for (const auto& n : names) {
        std::cout << std::format("hello, {}\n", n);
    }

    std::vector<int> nums{5, 3, 9, 1, 7, 2, 8};
    auto evenSquared = nums
        | std::views::filter([](int x) { return x % 2 == 0; })
        | std::views::transform([](int x) { return x * x; });

    std::cout << "even squared: ";
    for (int x : evenSquared) {
        std::cout << x << " ";
    }
    std::cout << "\n";

    return 0;
}
