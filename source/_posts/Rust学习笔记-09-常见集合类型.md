---
title: "Rust学习笔记 09：常见集合类型"
date: 2026-04-09 09:00:00
updated: 2026-04-09 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "集合"
abbrlink: "rust-note-09-collections"
---
对应代码文件：`src/bin/09_collections.rs`
运行命令：
```bash
cargo run --bin lesson09_collections
```
## 学习目标
本篇整理常用集合：`Vec<T>`、`String`、`HashMap<K, V>`、遍历、插入和 `entry` API。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
use std::collections::HashMap;

fn main() {
    // Vec<T> 是可变长度数组，适合保存同类型列表。
    let mut numbers = vec![1, 2, 3];
    numbers.push(4);
    println!("Vec: {numbers:?}");

    for number in &numbers {
        println!("遍历 Vec: {number}");
    }

    // String 是 UTF-8 字符串，适合动态拼接文本。
    let mut text = String::from("Rust");
    text.push(' ');
    text.push_str("collections");
    println!("String: {text}");

    // HashMap<K, V> 保存键值对。
    let mut scores = HashMap::new();
    scores.insert(String::from("Alice"), 90);
    scores.insert(String::from("Bob"), 85);

    // entry 常用于“有则使用，无则插入”的逻辑。
    scores.entry(String::from("Alice")).or_insert(100);
    scores.entry(String::from("Carol")).or_insert(88);

    for (name, score) in &scores {
        println!("{name}: {score}");
    }
}
```
## 逐段解读
### Vec

`vec![1, 2, 3]` 创建可增长列表。`push` 可以追加元素。

### 借用遍历

`for number in &numbers` 借用遍历，不移动 `Vec` 的所有权。

### String

`String::from("Rust")` 创建可增长 UTF-8 字符串，`push` 加字符，`push_str` 加字符串切片。

### HashMap

`HashMap::new()` 创建键值表。`insert` 添加或覆盖键值。

### entry

`entry(...).or_insert(...)` 表示键存在就取原值，不存在就插入默认值。
## 初学者拓展
`Vec<T>` 适合保存同类型、多数量、长度可变的数据。

`String` 是拥有所有权的字符串，适合运行时拼接和修改。

`HashMap` 查询快，适合按键查值，例如用户名到分数。
## 常见误区
- 遍历 `Vec` 时如果写 `for x in numbers`，会移动集合。想保留集合应使用 `&numbers`。
- `String` 按字节存储 UTF-8，不要随意按索引切中文字符。
- `HashMap` 遍历顺序不稳定，不要依赖输出顺序。
## 进阶练习与参考答案
### 练习 1：统计单词出现次数

要求：给定 `"rust rust book"`，用 `HashMap` 统计每个单词出现次数。

参考答案：

```rust
use std::collections::HashMap;

let text = "rust rust book";
let mut counts = HashMap::new();
for word in text.split_whitespace() {
    *counts.entry(word).or_insert(0) += 1;
}
println!("{counts:?}");
```

解释：`entry` 返回可变引用，前面的 `*` 用于修改引用指向的计数值。

### 练习 2：过滤 Vec 中的偶数

要求：给定 `vec![1, 2, 3, 4, 5, 6]`，生成只包含偶数的新 `Vec`。

参考答案：

```rust
let numbers = vec![1, 2, 3, 4, 5, 6];
let evens: Vec<i32> = numbers
    .iter()
    .copied()
    .filter(|n| n % 2 == 0)
    .collect();
println!("{evens:?}");
```

解释：`iter()` 借用元素，`copied()` 把 `&i32` 转成 `i32`，最后 `collect()` 收集成新集合。
## 相关笔记
- [Rust学习笔记 08：枚举与模式匹配](https://kylinxin.github.io/2026/04/08/Rust学习笔记-08-枚举与模式匹配/)
- [Rust学习笔记 10：模块系统和包管理](https://kylinxin.github.io/2026/04/10/Rust学习笔记-10-模块系统和包管理/)
