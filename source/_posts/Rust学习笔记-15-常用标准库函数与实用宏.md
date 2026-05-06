---
title: "Rust学习笔记 15：常用标准库函数与实用宏"
date: 2026-04-15 09:00:00
updated: 2026-05-06 19:50:00
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

本节整理日常 Rust 编程中常见的标准库函数、方法和宏。它们能显著提高代码表达力。

宏看起来像函数，但以 `!` 结尾，并在编译期展开。常见宏包括 `println!`、`format!`、`vec!`、`dbg!`。

- 理解函数、方法和宏的基本区别。
- 掌握格式化输出、调试输出和集合创建。
- 会使用 `Option`、`Result` 的常用方法。
- 知道 `dbg!`、`assert!`、`panic!` 的适用场景。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 标准库 std | Rust 自带的基础功能库。 | 包括集合、字符串、IO、线程、时间等。 |
| 宏 macro | 编译期展开的代码生成机制。 | 以 `!` 结尾，如 `println!`。 |
| format! | 生成格式化字符串但不直接打印。 | 常用于拼接可读文本。 |
| dbg! | 打印表达式和位置，返回表达式值。 | 适合临时调试。 |
| assert! | 断言条件必须为真。 | 常用于测试或检查程序假设。 |

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

## 运行与观察

使用 `cargo run --bin lesson15_std_functions_macros` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### println!

用于向终端打印文本，支持 `{}`、`{:?}` 等格式占位。

### format!

返回 `String`，适合构造后续要保存或返回的文本。

### vec!

快速创建 `Vec`，如 `vec![1, 2, 3]`。

### Option 方法

`unwrap_or` 可以在 `None` 时提供默认值。

## 专有词语详解

### 标准库 std

Rust 自带的基础功能库。

包括集合、字符串、IO、线程、时间等。

### 宏 macro

编译期展开的代码生成机制。

以 `!` 结尾，如 `println!`。

### format!

生成格式化字符串但不直接打印。

常用于拼接可读文本。

### dbg!

打印表达式和位置，返回表达式值。

适合临时调试。

### assert!

断言条件必须为真。

常用于测试或检查程序假设。

## 初学者拓展

`println!` 是宏，因为它需要支持可变数量参数和格式字符串检查。

`dbg!` 会取得表达式所有权并返回它。调试非 Copy 值时要注意是否发生移动。

`assert_eq!` 比 `assert!(a == b)` 的失败信息更清楚。

标准库方法通常比手写循环更简洁，但初学时应该先理解它们背后的所有权和迭代器行为。

## 常见误区

- 不要把 `format!` 和 `println!` 混淆。前者返回字符串，后者打印到终端。
- `unwrap_or(default)` 会立即计算默认值。默认值计算昂贵时考虑 `unwrap_or_else`。
- 不要把 `dbg!` 长期留在正式输出里。
- 宏不是普通函数，错误信息有时会指向展开后的代码，需要回到宏调用位置理解。

## 进阶练习与参考答案

### 练习 1：格式化用户信息

要求：用 `format!` 生成用户描述字符串。

参考答案：

```rust
fn main() {
    let name = "Kylin";
    let age = 20;
    let text = format!("用户 {name}, 年龄 {age}");
    println!("{text}");
}
```

解释：`format!` 返回 `String`，后续可以保存或传给函数。

### 练习 2：Option 默认值

要求：读取可选分数，没有分数时使用 0。

参考答案：

```rust
fn main() {
    let score: Option<i32> = None;
    let value = score.unwrap_or(0);
    println!("{value}");
}
```

解释：`unwrap_or` 是处理 `None` 的常用方法。

### 练习 3：断言检查

要求：检查数组长度是否为 3。

参考答案：

```rust
fn main() {
    let values = vec![1, 2, 3];
    assert_eq!(values.len(), 3);
    println!("检查通过");
}
```

解释：`assert_eq!` 在左右不相等时给出清晰失败信息。

## 相关笔记

- [Rust学习笔记 14：生命周期](https://kylinxin.github.io/2026/04/14/Rust学习笔记-14-生命周期/)
- [Rust学习笔记 16：异步编程 async-await](https://kylinxin.github.io/2026/04/16/Rust学习笔记-16-异步编程%20async-await/)
