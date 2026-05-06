---
title: "Rust学习笔记 04：流程控制"
date: 2026-04-04 09:00:00
updated: 2026-04-04 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "流程控制"
abbrlink: "rust-note-04-control-flow"
---
对应代码文件：`src/bin/04_control_flow.rs`
运行命令：
```bash
cargo run --bin lesson04_control_flow
```
## 学习目标
本篇整理 Rust 的分支和循环：`if` 表达式、`loop`、`while`、`for`、范围语法和 `break` 返回值。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
fn main() {
    let number = 7;

    // if 是表达式，每个分支返回的类型必须一致。
    let size = if number < 5 { "small" } else { "large" };
    println!("{number} is {size}");

    // loop 会无限循环，通常配合 break。
    let mut counter = 0;
    let loop_result = loop {
        counter += 1;
        if counter == 3 {
            break counter * 10;
        }
    };
    println!("loop 返回值: {loop_result}");

    // while 适合条件循环。
    let mut countdown = 3;
    while countdown > 0 {
        println!("{countdown}");
        countdown -= 1;
    }

    // for 适合遍历迭代器或范围。
    for item in ["所有权", "借用", "生命周期"] {
        println!("学习主题: {item}");
    }

    for n in 1..=3 {
        println!("闭区间数字: {n}");
    }
}
```
## 逐段解读
### if 表达式

`let size = if number < 5 { "small" } else { "large" };` 中 `if` 会产生值。两个分支返回类型必须一致。

### loop 循环

`loop` 默认无限循环，通常配合 `break`。这里 `break counter * 10` 让循环返回一个值。

### while 循环

`while countdown > 0` 适合条件循环。每轮循环结束前要改变条件，否则可能死循环。

### for 遍历

`for item in [...]` 遍历数组。`for` 是 Rust 中最常用、最安全的遍历方式。

### 范围语法

`1..=3` 是闭区间，包含 1、2、3。`1..3` 是半开区间，只包含 1、2。
## 初学者拓展
Rust 的 `if` 是表达式，这让条件选择结果可以直接赋值给变量。

`loop` 适合“直到内部条件满足才退出”的场景。`while` 适合外部条件明确的循环。

优先使用 `for` 遍历集合和范围。它比手动索引更安全，也更符合 Rust 风格。
## 常见误区
- `if` 两个分支返回类型必须一致，不能一个返回字符串，另一个返回数字。
- `while` 中如果忘记更新条件变量，容易形成无限循环。
- 不要用 `0..=len` 访问数组，这会越界。数组最大索引是 `len - 1`。
## 进阶练习与参考答案
### 练习 1：FizzBuzz

要求：用 `for n in 1..=30` 打印数字。3 的倍数打印 `Fizz`，5 的倍数打印 `Buzz`，同时满足打印 `FizzBuzz`。

参考答案：

```rust
for n in 1..=30 {
    if n % 15 == 0 {
        println!("FizzBuzz");
    } else if n % 3 == 0 {
        println!("Fizz");
    } else if n % 5 == 0 {
        println!("Buzz");
    } else {
        println!("{n}");
    }
}
```

解释：先判断 15 的倍数，否则 3 和 5 的公共倍数会提前进入单独分支。

### 练习 2：用 loop 找到第一个平方大于 100 的数

要求：从 1 开始递增，使用 `loop` 和 `break` 返回第一个满足 `n * n > 100` 的数。

参考答案：

```rust
let mut n = 1;
let answer = loop {
    if n * n > 100 {
        break n;
    }
    n += 1;
};
println!("第一个平方大于 100 的数: {answer}");
```

解释：`loop` 可以通过 `break 值` 返回结果，适合这种“找到目标后退出”的逻辑。
## 相关笔记
- [Rust学习笔记 03：函数与作用域](https://kylinxin.github.io/2026/04/03/Rust学习笔记-03-函数与作用域/)
- [Rust学习笔记 05：所有权与借用](https://kylinxin.github.io/2026/04/05/Rust学习笔记-05-所有权与借用/)
