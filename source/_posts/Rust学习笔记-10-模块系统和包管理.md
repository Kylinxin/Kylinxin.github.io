---
title: "Rust学习笔记 10：模块系统和包管理"
date: 2026-04-10 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "模块"
abbrlink: "rust-note-10-modules-packages"
---
对应代码文件：`src/bin/10_modules_packages.rs`

运行命令：

```bash
cargo run --bin lesson10_modules_packages
```

## 学习目标

模块系统用于组织代码、控制可见性和管理命名空间。Cargo 则负责构建、运行和包管理。

本项目把每节课放在 `src/bin` 下，并在 `Cargo.toml` 中声明多个 bin target。

- 理解 package、crate、module 的基本区别。
- 掌握 `mod`、`pub`、`use` 的用途。
- 知道如何通过 Cargo 运行指定二进制示例。
- 理解路径中的 `crate`、`self`、`super` 含义。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| package | 一个 Cargo 管理的项目。 | 通常由一个 `Cargo.toml` 描述。 |
| crate | Rust 编译单元。 | 可以是库 crate，也可以是二进制 crate。 |
| module | crate 内部的代码组织单元。 | `mod math` 定义一个模块。 |
| pub | 公开可见性关键字。 | 没有 `pub` 的项默认只在当前模块及子模块内可见。 |
| use | 把路径引入当前作用域。 | 让长路径写起来更短。 |

## 完整源码

```rust
// 一个文件内也可以定义模块，便于把相关代码分组。
mod math {
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    pub mod stats {
        pub fn average(values: &[f64]) -> f64 {
            let sum: f64 = values.iter().sum();
            sum / values.len() as f64
        }
    }
}

// use 可以把路径引入当前作用域，减少重复书写。
use math::stats::average;

fn main() {
    let sum = math::add(2, 3);
    println!("模块函数 add: {sum}");

    let data = [80.0, 90.0, 100.0];
    println!("平均值: {}", average(&data));

    // 在真实项目中，Cargo.toml 描述 package，src/lib.rs 和 src/bin/*.rs 组织 crate。
    println!("本文件用内联 mod 演示模块，保持示例自包含。");
}
```

## 运行与观察

使用 `cargo run --bin lesson10_modules_packages` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 内部模块

示例用 `mod math` 在单文件中定义模块，保持本节自包含。

### 公开函数

`pub fn add` 允许模块外部调用。

### 路径调用

`math::add(2, 3)` 通过模块路径访问函数。

### use 简化路径

`use crate::math::add;` 后可以直接调用 `add()`。

## 专有词语详解

### package

一个 Cargo 管理的项目。

通常由一个 `Cargo.toml` 描述。

### crate

Rust 编译单元。

可以是库 crate，也可以是二进制 crate。

### module

crate 内部的代码组织单元。

`mod math` 定义一个模块。

### pub

公开可见性关键字。

没有 `pub` 的项默认只在当前模块及子模块内可见。

### use

把路径引入当前作用域。

让长路径写起来更短。

## 初学者拓展

一个 package 可以包含多个二进制 crate。本项目每个 `src/bin/*.rs` 都是一个独立二进制。

`mod` 是声明模块。模块代码可以写在同一文件，也可以拆到独立文件。

`pub` 只公开当前项。结构体公开后，字段仍然默认私有，字段也要单独 `pub`。

`use` 不会改变所有权，也不会复制代码。它只是让路径在当前作用域更方便。

## 常见误区

- 不要把 package、crate、module 混为一谈。它们处在不同组织层级。
- 函数写了 `pub`，所在模块如果不可见，外部仍然访问不到。
- `use` 引入同名项时可能冲突，需要使用别名 `as`。
- 多个 `src/bin` 文件彼此独立，不能直接共享私有函数。共享代码通常放到库模块。

## 进阶练习与参考答案

### 练习 1：定义工具模块

要求：定义 `utils` 模块，公开 `double` 函数。

参考答案：

```rust
mod utils {
    pub fn double(value: i32) -> i32 {
        value * 2
    }
}

fn main() {
    println!("{}", utils::double(21));
}
```

解释：`pub` 让模块外的 `main` 能调用 `double`。

### 练习 2：使用 use

要求：用 `use` 简化上题的调用路径。

参考答案：

```rust
mod utils {
    pub fn double(value: i32) -> i32 {
        value * 2
    }
}

use utils::double;

fn main() {
    println!("{}", double(21));
}
```

解释：`use utils::double` 后，当前作用域可以直接写函数名。

### 练习 3：Cargo 运行指定目标

要求：写出运行第 10 节的命令。

参考答案：

```bash
cargo run --bin lesson10_modules_packages
```

解释：`--bin` 后面跟的是 `Cargo.toml` 中声明的 bin 名，不是文件名。

## 相关笔记

- [Rust学习笔记 09：常见集合类型](https://kylinxin.github.io/2026/04/09/Rust学习笔记-09-常见集合类型/)
- [Rust学习笔记 11：错误处理](https://kylinxin.github.io/2026/04/11/Rust学习笔记-11-错误处理/)
