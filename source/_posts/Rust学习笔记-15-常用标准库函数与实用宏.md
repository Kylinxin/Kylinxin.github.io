---
title: "Rust学习笔记 15：常用标准库函数与实用宏"
date: 2026-04-15 09:00:00
updated: 2026-04-15 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "标准库"
abbrlink: "rust-note-15-std-functions-macros"
---
对应代码文件：`src/bin/15_std_functions_macros.rs`
运行命令：
```bash
cargo run --bin lesson15_std_functions_macros
```
## 学习目标
本篇整理迭代器组合、闭包、`Option` 常用方法、`dbg!`、`format!`、`vec!` 和 `assert_eq!`。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
fn main() {
    // vec! 创建可增长的 Vec；后续 push 体现它和固定数组的区别。
    let mut numbers = vec![1, 2, 3, 4, 5];
    numbers.push(6);

    // iter/map/filter/collect 是标准库中常用的迭代器组合。
    let even_squares: Vec<i32> = numbers
        .iter()
        .map(|n| n * n)
        .filter(|n| n % 2 == 0)
        .collect();
    println!("偶数平方: {even_squares:?}");

    // Option 常用 map、unwrap_or 等方法处理可能不存在的值。
    let maybe_name = Some("Rust");
    let display_name = maybe_name
        .map(str::to_uppercase)
        .unwrap_or(String::from("UNKNOWN"));
    println!("名称: {display_name}");

    // dbg! 会打印表达式和结果，适合临时调试。
    let total: i32 = numbers.iter().sum();
    dbg!(total);

    // format! 生成 String，println! 输出到终端，vec! 创建 Vec。
    let message = format!("一共有 {} 个数字", numbers.len());
    println!("{message}");

    // assert_eq! 常用于测试或运行时检查。
    assert_eq!(numbers.first(), Some(&1));
}
```
## 逐段解读
### vec 宏

`vec![1, 2, 3]` 创建可增长向量，`push` 体现它和数组的区别。

### 迭代器链

`iter().map(...).filter(...).collect()` 是标准库中常见的数据处理流水线。

### 闭包

`|n| n * n` 是闭包，适合传给 `map`、`filter` 等高阶函数。

### Option 方法

`maybe_name.map(...).unwrap_or(...)` 用链式方式处理可能不存在的值。

### dbg 宏

`dbg!(total)` 会把表达式和结果打印到标准错误，适合临时调试。

### 断言宏

`assert_eq!` 检查两个值是否相等，不相等时 panic。
## 初学者拓展
迭代器是 Rust 标准库的核心能力之一。它能让集合处理更声明式。

`map` 转换元素，`filter` 保留满足条件的元素，`collect` 收集成目标集合。

宏通常带 `!`。常见宏包括 `println!`、`vec!`、`format!`、`dbg!`。
## 常见误区
- `dbg!` 会取得表达式所有权，调试非 Copy 值时要注意移动问题。
- `unwrap_or` 的默认值会立即求值。默认值构造昂贵时可用 `unwrap_or_else`。
- 迭代器链中 `iter()` 得到引用，必要时需要 `copied()` 或 `cloned()`。
## 进阶练习与参考答案
### 练习 1：筛选并求和

要求：给定 `vec![1, 2, 3, 4, 5, 6]`，筛选偶数，平方后求和。

参考答案：

```rust
let numbers = vec![1, 2, 3, 4, 5, 6];
let sum: i32 = numbers
    .iter()
    .map(|n| n * n)
    .filter(|n| n % 2 == 0)
    .sum();
println!("{sum}");
```

解释：这里先平方再筛选偶数平方。`sum()` 可以直接消费迭代器得到总和。

### 练习 2：Option 默认用户名

要求：如果 `Option<&str>` 是 `None`，输出 `"GUEST"`，否则输出大写用户名。

参考答案：

```rust
let maybe_name: Option<&str> = None;
let name = maybe_name
    .map(str::to_uppercase)
    .unwrap_or_else(|| String::from("GUEST"));
println!("{name}");
```

解释：`unwrap_or_else` 只在 `None` 时执行闭包，适合延迟构造默认值。
## 相关笔记
- [Rust学习笔记 14：生命周期](https://kylinxin.github.io/2026/04/14/Rust学习笔记-14-生命周期/)
- [Rust学习笔记 16：异步编程 async-await](https://kylinxin.github.io/2026/04/16/Rust学习笔记-16-异步编程%20async-await/)
