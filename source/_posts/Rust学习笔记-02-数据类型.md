---
title: "Rust学习笔记 02：数据类型"
date: 2026-04-02 09:00:00
updated: 2026-05-06 19:50:00
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

本节整理 Rust 的标量类型和复合类型。类型决定一个值能保存什么数据，也决定它能参与哪些运算。

Rust 通常能自动推断类型，但在解析字符串、处理空集合、或多个类型都可能成立时，需要你显式标注。

- 区分标量类型和复合类型。
- 掌握整数、浮点数、布尔值、字符的基本用法。
- 会使用元组和数组保存多个值。
- 知道类型标注在什么情况下是必要的。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 标量 scalar | 表示单个值的类型。 | 整数、浮点数、布尔值和字符都属于标量。 |
| 复合 compound | 把多个值组合成一个值的类型。 | 元组和数组是本节的两个基础复合类型。 |
| 类型推断 inference | 编译器根据上下文推断变量类型。 | 能少写类型，但不能让含义变模糊。 |
| 元组 tuple | 长度固定、元素类型可以不同的组合。 | 适合临时返回多个不同含义的值。 |
| 数组 array | 长度固定、元素类型相同的连续集合。 | 适合保存固定数量的数据。 |

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

## 运行与观察

使用 `cargo run --bin lesson02_data_types` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 整数与浮点数

`let integer: i32 = 42;` 和 `let float: f64 = 3.14;` 展示显式类型标注。

### 布尔值与字符

`bool` 只有 `true` 和 `false`。`char` 表示 Unicode 字符，不只是 ASCII。

### 元组

`let tuple = (500, 6.4, 'R');` 可以通过 `.0`、`.1`、`.2` 访问元素。

### 数组

`let numbers = [1, 2, 3, 4, 5];` 所有元素类型相同，长度固定。

## 专有词语详解

### 标量 scalar

表示单个值的类型。

整数、浮点数、布尔值和字符都属于标量。

### 复合 compound

把多个值组合成一个值的类型。

元组和数组是本节的两个基础复合类型。

### 类型推断 inference

编译器根据上下文推断变量类型。

能少写类型，但不能让含义变模糊。

### 元组 tuple

长度固定、元素类型可以不同的组合。

适合临时返回多个不同含义的值。

### 数组 array

长度固定、元素类型相同的连续集合。

适合保存固定数量的数据。

## 初学者拓展

整数类型如 `i32`、`u64` 的区别在于是否带符号和占用位数。`i` 表示 signed，`u` 表示 unsigned。

浮点数默认常用 `f64`，精度高于 `f32`。涉及金额时不要直接依赖浮点数做精确小数计算。

`char` 使用单引号，字符串切片 `&str` 使用双引号。`'R'` 和 `"R"` 类型不同。

数组长度属于类型的一部分。`[i32; 3]` 和 `[i32; 4]` 是不同类型。

## 常见误区

- 不要把元组当作可增长列表。元组长度和每个位置的类型都是固定的。
- 不要越界访问数组。Rust 会在运行时阻止越界，避免读到非法内存。
- `parse()` 常常需要类型标注，否则编译器不知道要解析成哪种数字。
- 字符 `char` 可能占 4 字节，不等同于 C 语言里的一个字节字符。

## 进阶练习与参考答案

### 练习 1：解析数字

要求：把字符串 `"128"` 解析为 `u32` 并乘以 2。

参考答案：

```rust
fn main() {
    let raw = "128";
    let value: u32 = raw.parse().expect("需要 u32 数字");
    println!("{}", value * 2);
}
```

解释：`parse()` 需要知道目标类型，所以写 `let value: u32`。

### 练习 2：解构元组

要求：用元组保存姓名、年龄、是否学生，并分别打印。

参考答案：

```rust
fn main() {
    let person = ("Kylin", 20, true);
    let (name, age, is_student) = person;
    println!("{name}, {age}, {is_student}");
}
```

解释：解构能给每个位置起名字，比 `.0`、`.1` 更清楚。

### 练习 3：数组求和

要求：对 `[2, 4, 6, 8]` 求和。

参考答案：

```rust
fn main() {
    let numbers = [2, 4, 6, 8];
    let mut sum = 0;
    for number in numbers {
        sum += number;
    }
    println!("sum={sum}");
}
```

解释：数组可以直接用 `for` 遍历，元素类型一致。

## 相关笔记

- [Rust学习笔记 01：变量和可变性](https://kylinxin.github.io/2026/04/01/Rust学习笔记-01-变量和可变性/)
- [Rust学习笔记 03：函数与作用域](https://kylinxin.github.io/2026/04/03/Rust学习笔记-03-函数与作用域/)
