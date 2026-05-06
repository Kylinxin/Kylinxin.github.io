---
title: "Rust学习笔记 06：引用与切片"
date: 2026-04-06 09:00:00
updated: 2026-04-06 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "引用"
abbrlink: "rust-note-06-references-slices"
---
对应代码文件：`src/bin/06_references_slices.rs`
运行命令：
```bash
cargo run --bin lesson06_references_slices
```
## 学习目标
本篇整理引用和切片：不可变引用、可变引用、字符串切片、数组切片，以及用切片表达“借用一部分数据”。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
fn first_word(text: &str) -> &str {
    // bytes() 逐字节遍历字符串。这里只处理 ASCII 空格边界。
    for (index, byte) in text.bytes().enumerate() {
        if byte == b' ' {
            return &text[..index];
        }
    }
    text
}

fn main() {
    let message = String::from("Rust ownership");

    // &message 创建不可变引用，可以读但不能改。
    let ref1 = &message;
    let ref2 = &message;
    println!("两个不可变引用: {ref1}, {ref2}");

    // 切片引用一段连续数据，不拥有数据。
    let word = first_word(&message);
    println!("第一个单词: {word}");

    let numbers = [10, 20, 30, 40, 50];
    let middle = &numbers[1..4];
    println!("数组切片: {middle:?}");

    let mut name = String::from("Rust");
    {
        // 可变引用的作用域越小，越容易避免借用冲突。
        let mutable_ref = &mut name;
        mutable_ref.push_str("acean");
    }
    println!("可变引用修改后: {name}");
}
```
## 逐段解读
### 字符串切片函数

`first_word(text: &str) -> &str` 接收字符串切片并返回字符串切片，不拥有数据。

### 遍历字节

`text.bytes().enumerate()` 同时得到字节和索引。示例用空格定位第一个单词。

### 不可变引用

`let ref1 = &message; let ref2 = &message;` 可以同时存在多个不可变引用。

### 字符串切片

`&text[..index]` 表示从开头到 index 前一位的字符串片段。

### 数组切片

`&numbers[1..4]` 借用数组中索引 1 到 3 的连续片段。

### 可变引用作用域

可变引用放进小作用域，可以减少借用冲突。
## 初学者拓展
切片不拥有数据，只是借用连续的一段数据。它常用于函数参数，避免复制。

`&str` 是字符串切片。字符串字面量本身就是 `&str`。

切片范围通常是左闭右开，例如 `1..4` 包含 1、2、3，不包含 4。
## 常见误区
- 不要对中文字符串随意按字节索引切片，可能切在 UTF-8 字符中间导致 panic。
- 可变引用存在期间，不能同时使用其他引用访问同一数据。
- 返回切片时，切片不能比被引用的数据活得更久。
## 进阶练习与参考答案
### 练习 1：返回最后一个单词

要求：写 `last_word(text: &str) -> &str`，返回 ASCII 空格分隔的最后一个单词。

参考答案：

```rust
fn last_word(text: &str) -> &str {
    match text.rfind(' ') {
        Some(index) => &text[index + 1..],
        None => text,
    }
}
```

解释：`rfind` 从右往左找空格。返回切片时不复制字符串。

### 练习 2：获取数组前半部分

要求：给定 `[10, 20, 30, 40, 50, 60]`，返回前 3 个元素切片并打印。

参考答案：

```rust
let numbers = [10, 20, 30, 40, 50, 60];
let first_half = &numbers[..3];
println!("{first_half:?}");
```

解释：`..3` 表示从开头到索引 3 之前，也就是 0、1、2 三个位置。
## 相关笔记
- [Rust学习笔记 05：所有权与借用](https://kylinxin.github.io/2026/04/05/Rust学习笔记-05-所有权与借用/)
- [Rust学习笔记 07：结构体和方法](https://kylinxin.github.io/2026/04/07/Rust学习笔记-07-结构体和方法/)
