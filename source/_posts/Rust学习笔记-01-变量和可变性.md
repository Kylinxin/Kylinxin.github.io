---
title: "Rust学习笔记 01：变量和可变性"
date: 2026-04-01 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "变量"
abbrlink: "rust-note-01-variables-mutability"
---
对应代码文件：`src/bin/01_variables_mutability.rs`

运行命令：

```bash
cargo run --bin lesson01_variables_mutability
```

## 学习目标

本节讲清楚 Rust 变量的默认规则：变量默认不可变，需要修改时显式写 `mut`。

这些规则不是语法限制那么简单。它们让编译器能提前发现意外修改，也为后续所有权、借用和并发安全打基础。

- 理解 `let` 创建绑定，而不是简单等同于其他语言里的赋值。
- 区分不可变变量、可变变量、shadowing 和常量。
- 知道什么时候应该用 `mut`，什么时候应该用 shadowing。
- 能解释 `const` 为什么必须写类型和编译期值。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 绑定 binding | `let name = value` 会把名字绑定到一个值上。 | Rust 常说“绑定”而不是“变量赋值”，因为名字和值的关系还会受所有权影响。 |
| 不可变 immutable | 默认不能修改同一个绑定里的值。 | 这能减少意外状态变化，让代码更容易推理。 |
| 可变 mutable | 用 `mut` 声明后，可以给同一个变量重新赋值。 | `mut` 是对读者和编译器的明确提示：这里会改变状态。 |
| 遮蔽 shadowing | 用新的 `let` 声明同名变量，旧绑定被新绑定遮住。 | 它可以改变值，也可以改变类型，常用于转换数据。 |
| 常量 const | 全局或局部的固定值，必须标注类型，且必须能在编译期确定。 | 适合保存不会变化的配置值，比如最大重试次数。 |

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

## 运行与观察

使用 `cargo run --bin lesson01_variables_mutability` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 不可变变量

`let language = "Rust";` 创建不可变绑定。后续不能写 `language = ...`。

### 可变变量

`let mut score = 0;` 允许后续重新赋值。示例里用 `score += 10` 修改分数。

### 遮蔽变量

`let spaces = "   "; let spaces = spaces.len();` 使用同名 `let` 把字符串转换成长度。

### 常量

`const MAX_POINTS: u32 = 100_000;` 在编译期确定，类型 `u32` 必须写出来。

## 专有词语详解

### 绑定 binding

`let name = value` 会把名字绑定到一个值上。

Rust 常说“绑定”而不是“变量赋值”，因为名字和值的关系还会受所有权影响。

### 不可变 immutable

默认不能修改同一个绑定里的值。

这能减少意外状态变化，让代码更容易推理。

### 可变 mutable

用 `mut` 声明后，可以给同一个变量重新赋值。

`mut` 是对读者和编译器的明确提示：这里会改变状态。

### 遮蔽 shadowing

用新的 `let` 声明同名变量，旧绑定被新绑定遮住。

它可以改变值，也可以改变类型，常用于转换数据。

### 常量 const

全局或局部的固定值，必须标注类型，且必须能在编译期确定。

适合保存不会变化的配置值，比如最大重试次数。

## 初学者拓展

变量默认不可变，是 Rust 倾向“先保证清晰，再允许变化”的体现。

`mut` 不会绕开类型系统。可变变量可以改变值，但不能把 `i32` 直接改成 `String`。

shadowing 创建的是新绑定，因此可以改变类型。它很适合把输入字符串逐步转换为数字、长度或结构化数据。

`const` 和不可变变量不同。不可变变量仍然是运行时绑定，常量则会在编译期展开到使用位置。

## 常见误区

- 不要把“不可变”理解成值永远不能变化。它指的是当前绑定不能被重新赋值。
- 不要滥用 `mut`。如果只需要一次转换，shadowing 往往更清晰。
- `const` 不是 `let` 的加强版。它必须写类型，也不能保存运行时才知道的结果。
- 数字里的下划线只提高可读性，`100_000` 和 `100000` 是同一个数。

## 进阶练习与参考答案

### 练习 1：修复不可变变量错误

要求：把一个分数从 80 改成 90，并打印最终结果。

参考答案：

```rust
fn main() {
    let mut score = 80;
    score = 90;
    println!("score={score}");
}
```

解释：`score` 需要修改，所以声明时必须写 `mut`。

### 练习 2：用 shadowing 改变类型

要求：把字符串 `"42"` 转成数字，再加 8 输出。

参考答案：

```rust
fn main() {
    let value = "42";
    let value: i32 = value.parse().expect("需要数字");
    println!("{}", value + 8);
}
```

解释：第二个 `let value` 创建了新绑定，类型从 `&str` 变成 `i32`。

### 练习 3：定义常量

要求：定义常量 `MAX_RETRY`，表示最多重试 3 次。

参考答案：

```rust
const MAX_RETRY: u8 = 3;

fn main() {
    println!("最多重试 {MAX_RETRY} 次");
}
```

解释：`const` 必须写类型，适合表达稳定不变的规则。

## 相关笔记

- [Rust学习笔记 02：数据类型](https://kylinxin.github.io/2026/04/02/Rust学习笔记-02-数据类型/)
