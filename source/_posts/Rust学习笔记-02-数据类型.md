---
title: "Rust学习笔记 02：数据类型"
date: 2026-04-02 09:00:00
updated: 2026-04-02 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "数据类型"
abbrlink: "rust-note-02-data-types"
---
对应代码文件：`src/bin/02_data_types.rs`
运行命令：
```bash
cargo run --bin lesson02_data_types
```
## 学习目标
本篇整理 Rust 的标量类型、元组、数组、类型标注、解构和调试格式输出。重点是理解单个值和一组值的表达方式。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
fn main() {
    // 标量类型：整数、浮点数、布尔值、字符。
    let age: u8 = 20;
    let price: f64 = 19.99;
    let is_active: bool = true;
    let chinese_char: char = '中';
    println!("age={age}, price={price}, active={is_active}, char={chinese_char}");

    // 元组可以组合不同类型，适合表示固定长度的一组值。
    let student: (&str, u8, bool) = ("Kylin", 20, true);
    let (name, student_age, enrolled) = student;
    println!("name={name}, age={student_age}, enrolled={enrolled}");
    println!("也可以用索引访问元组: {}", student.0);

    // 数组长度固定，所有元素类型相同。
    let scores: [i32; 3] = [90, 85, 88];
    println!("第一门成绩: {}", scores[0]);

    // [value; len] 可以快速创建重复值数组。
    let zeros = [1; 5];
    println!("重复数组: {zeros:?}");
}
```
## 逐段解读
### 标量类型

`u8` 是无符号 8 位整数，`f64` 是 64 位浮点数，`bool` 表示真假，`char` 表示 Unicode 字符。

### 格式字符串

`println!` 可以在字符串中直接写 `{age}`、`{price}` 等变量名，便于观察多个值。

### 元组

`let student: (&str, u8, bool)` 定义元组。元组能组合不同类型，适合固定长度的小型数据组合。

### 解构和索引

`let (name, student_age, enrolled) = student;` 是解构。`student.0` 使用点号索引访问元组字段。

### 数组

`let scores: [i32; 3]` 定义固定长度数组。数组所有元素类型相同，长度不能动态增长。

### 调试格式

`{:?}` 是调试输出格式。数组等复合数据通常用 `:?` 打印。
## 初学者拓展
Rust 是静态类型语言。编译器经常能推断类型，但初学阶段显式写类型有助于理解。

`i` 开头的整数类型可以有负数，`u` 开头的整数类型只能非负。`usize` 常用于索引和长度。

数组长度固定。后面学到的 `Vec` 可以动态增长。固定长度用数组，长度变化用 `Vec`。
## 常见误区
- 不要把 Rust 的 `char` 理解成单字节字符。它能表示中文等 Unicode 字符。
- 不要以为数组可以 `push`。数组长度固定，不能追加元素。
- 不要滥用元组保存复杂业务数据。字段一多，`.0`、`.1` 会降低可读性。
## 进阶练习与参考答案
### 练习 1：为学生元组增加成绩字段

要求：把 `student` 扩展为 `(姓名, 年龄, 是否在读, 成绩)`，然后解构并打印。

参考答案：

```rust
let student: (&str, u8, bool, u32) = ("Kylin", 20, true, 95);
let (name, age, enrolled, score) = student;
println!("{name}, 年龄 {age}, 在读: {enrolled}, 成绩: {score}");
```

解释：元组可以组合不同类型，但字段越多越难读。真实项目中更推荐用结构体表达学生信息。

### 练习 2：计算数组平均分

要求：给定成绩数组 `[90, 85, 88]`，计算总分和平均分。平均分保留为 `f64`。

参考答案：

```rust
let scores: [i32; 3] = [90, 85, 88];
let sum: i32 = scores[0] + scores[1] + scores[2];
let average: f64 = sum as f64 / scores.len() as f64;
println!("总分: {sum}, 平均分: {average}");
```

解释：整数相除会得到整数结果。计算平均分时，要先把整数转成浮点数。
## 相关笔记
- [Rust学习笔记 01：变量和可变性](https://kylinxin.github.io/2026/04/01/Rust学习笔记-01-变量和可变性/)
- [Rust学习笔记 03：函数与作用域](https://kylinxin.github.io/2026/04/03/Rust学习笔记-03-函数与作用域/)
