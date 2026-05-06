---
title: "Rust学习笔记 02：数据类型"
date: 2026-05-06 19:11:02
updated: 2026-05-06 19:11:02
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "数据类型"
abbrlink: "rust-note-02-data-types"
---

本篇对应 `src/bin/02_data_types.rs`，重点整理 Rust 的标量类型、元组、数组、类型标注、解构和调试格式输出。

运行命令：

```bash
cargo run --bin lesson02_data_types
```

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

`let age: u8 = 20;` 定义无符号 8 位整数。`u` 表示 unsigned，只能保存非负数。

`let price: f64 = 19.99;` 定义 64 位浮点数。Rust 默认浮点类型通常是 `f64`。

`let is_active: bool = true;` 定义布尔值。布尔值只有 `true` 和 `false`。

`let chinese_char: char = '中';` 定义字符。Rust 的 `char` 是 Unicode 字符，不只是一个字节。

`let student: (&str, u8, bool) = ("Kylin", 20, true);` 定义元组。元组可以组合不同类型。

`let (name, student_age, enrolled) = student;` 是解构赋值，把元组每个位置的值绑定到新变量。

`student.0` 通过索引访问元组字段。元组索引使用点号加数字。

`let scores: [i32; 3] = [90, 85, 88];` 定义数组。数组所有元素类型相同，长度固定。

`let zeros = [1; 5];` 创建重复数组。这里实际是 5 个 `1`，变量名可以改成 `ones` 更准确。

`println!("重复数组: {zeros:?}");` 使用 `:?` 调试格式。数组等复合类型通常用 `:?` 打印。

## 初学者拓展

Rust 是静态类型语言。编译器经常能自动推断类型，但学习阶段显式写类型更容易理解代码。

整数类型有 `i32`、`u32`、`i64`、`usize` 等。`i` 可以有负数，`u` 只能非负。

数组长度固定。后面学到的 `Vec` 可以动态增长。固定长度用数组，长度变化用 `Vec`。

元组适合临时组合少量值。如果字段很多，推荐使用结构体，因为结构体字段有名字，可读性更强。

## 常见误区

不要把 `char` 理解成 C 语言里的单字节字符。Rust 的 `char` 可以表示中文。

不要以为数组可以 `push`。数组长度固定，不能追加元素。

不要滥用元组保存复杂业务数据。元素一多，`.0`、`.1` 会变得难读。

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

### 练习 3：比较元组索引和数组索引

要求：分别访问 `student` 的姓名和 `scores` 的第一门成绩，观察索引写法。

参考答案：

```rust
let student = ("Kylin", 20, true);
let scores = [90, 85, 88];

println!("学生姓名: {}", student.0);
println!("第一门成绩: {}", scores[0]);
```

解释：元组使用 `.0`、`.1` 访问字段。数组使用 `[0]`、`[1]` 访问元素。

### 练习 4：修正重复数组的语义

要求：当前变量名是 `zeros`，但数组内容是 `[1; 5]`。给出两种修正方式。

参考答案：

```rust
let zeros = [0; 5];
println!("全 0 数组: {zeros:?}");

let ones = [1; 5];
println!("全 1 数组: {ones:?}");
```

解释：变量名要和数据含义一致。命名准确能减少阅读误解。

## 相关笔记

- [Rust学习笔记 01：变量和可变性](https://kylinxin.github.io/2026/05/06/Rust学习笔记-01-变量和可变性/)
- [Rust学习笔记 03：函数与作用域](https://kylinxin.github.io/2026/05/06/Rust学习笔记-03-函数与作用域/)
