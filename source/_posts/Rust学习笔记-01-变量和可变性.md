---
title: "Rust学习笔记 01：变量和可变性"
date: 2026-05-06 19:11:02
updated: 2026-05-06 19:11:02
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "变量"
abbrlink: "rust-note-01-variables-mutability"
---

本篇对应 `src/bin/01_variables_mutability.rs`，重点整理 Rust 的变量规则：默认不可变、`mut`、shadowing 和 `const`。这些规则是后续学习所有权和借用的基础。

运行命令：

```bash
cargo run --bin lesson01_variables_mutability
```

## 完整源码

```rust
fn main() {
    // Rust 变量默认不可变。不可变能减少意外修改，让代码更容易推理。
    let language = "Rust";
    println!("正在学习: {language}");

    // 如果需要修改变量，必须显式写 mut。
    let mut score = 0;
    score += 10;
    println!("当前分数: {score}");

    // shadowing（遮蔽）会创建一个新的同名变量，不要求原变量是 mut。
    // 常用于把一个值转换成另一种形式。
    let spaces = "   ";
    let spaces = spaces.len();
    println!("空格数量: {spaces}");

    // const 是编译期常量，必须写类型，通常使用全大写命名。
    const MAX_POINTS: u32 = 100;
    println!("满分: {MAX_POINTS}");
}
```

## 逐段解读

`let language = "Rust";` 创建了一个不可变变量。Rust 中 `let` 绑定默认不可变，后面不能再给 `language` 赋新值。

默认不可变能减少状态变化。读代码时，如果没有看到 `mut`，就可以判断这个变量不会被重新赋值。

`println!("正在学习: {language}");` 使用格式化输出。`{language}` 会把变量值插入字符串中。

`let mut score = 0;` 创建可变变量。只有显式写 `mut`，Rust 才允许后续执行 `score += 10;`。

`let spaces = "   "; let spaces = spaces.len();` 使用 shadowing。第二个 `spaces` 是新变量，不是修改旧变量。

shadowing 允许同名变量改变类型。第一个 `spaces` 是 `&str`，第二个 `spaces` 是长度值 `usize`。

`const MAX_POINTS: u32 = 100;` 定义编译期常量。常量必须写类型，通常使用全大写命名。

## 初学者拓展

`mut` 表示“这个变量的值会变”。shadowing 表示“创建一个新的同名变量”。二者看起来相似，但语义不同。

如果一个值只是经过转换，例如字符串转数字，shadowing 很合适。如果一个值代表持续变化的状态，例如分数累计，`mut` 更自然。

`const` 适合保存规则，例如最大分数、及格线、默认端口。它不能保存运行时才知道的结果。

## 常见误区

不要以为 `let` 声明的变量都能修改。Rust 默认不可变，修改变量必须写 `mut`。

不要把 shadowing 当成“偷偷修改变量”。它是新的绑定，只是名字相同。

不要把 `const` 当普通变量。常量必须能在编译期确定，并且必须显式写类型。

## 进阶练习与参考答案

### 练习 1：区分不可变变量和可变变量

要求：新增变量 `level`，初始值为 `1`。先尝试不加 `mut` 修改它，再改成正确写法。

参考答案：

```rust
let mut level = 1;
level += 1;
println!("当前等级: {level}");
```

解释：如果写成 `let level = 1; level += 1;`，编译器会报错。因为 `level` 默认不可变，加上 `mut` 后才允许修改。

### 练习 2：用 shadowing 完成类型转换

要求：定义字符串 `"42"`，再用 shadowing 把它转换成整数，并打印加 8 后的结果。

参考答案：

```rust
let number = "42";
let number: i32 = number.parse().expect("必须是数字");
println!("计算结果: {}", number + 8);
```

解释：第一个 `number` 是 `&str`，第二个 `number` 是 `i32`。shadowing 保留语义相同的名字，同时让值变成适合计算的类型。

### 练习 3：比较 `mut` 和 shadowing

要求：分别用 `mut` 和 shadowing 写出“把分数从 80 变成 90”的代码，并说明区别。

参考答案：

```rust
let mut score = 80;
score = 90;
println!("可变变量写法: {score}");

let score = 80;
let score = 90;
println!("shadowing 写法: {score}");
```

解释：`mut` 修改同一个变量绑定。shadowing 创建新的同名变量。前者强调状态变化，后者强调重新计算得到新值。

### 练习 4：定义常量并参与判断

要求：定义及格分数常量 `PASS_SCORE`，再根据 `score` 判断是否及格。

参考答案：

```rust
const PASS_SCORE: u32 = 60;
let score: u32 = 75;
let passed = score >= PASS_SCORE;
println!("分数: {score}, 是否及格: {passed}");
```

解释：常量适合保存不会变化的规则。及格线不应该在代码里到处写 `60`，用 `PASS_SCORE` 更清楚。

## 相关笔记

- [Rust学习笔记 02：数据类型](https://kylinxin.github.io/2026/05/06/Rust学习笔记-02-数据类型/)
- [Rust学习笔记 03：函数与作用域](https://kylinxin.github.io/2026/05/06/Rust学习笔记-03-函数与作用域/)
