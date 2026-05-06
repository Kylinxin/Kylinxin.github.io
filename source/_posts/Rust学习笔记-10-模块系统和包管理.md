---
title: "Rust学习笔记 10：模块系统和包管理"
date: 2026-04-10 09:00:00
updated: 2026-04-10 09:00:00
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
本篇整理 `mod`、`pub`、嵌套模块、`use` 路径引入，以及 Cargo package 和 crate 的基本关系。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
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
## 逐段解读
### mod

`mod math { ... }` 定义模块，用来把相关代码分组。

### pub

`pub fn add` 表示函数对模块外可见。没有 `pub` 的项默认私有。

### 嵌套模块

`pub mod stats` 定义子模块。路径可以写成 `math::stats::average`。

### use

`use math::stats::average;` 把长路径引入当前作用域，后续可以直接调用 `average`。

### Cargo 组织

`Cargo.toml` 描述 package，`src/lib.rs`、`src/main.rs` 和 `src/bin/*.rs` 组织 crate。
## 初学者拓展
模块解决命名空间和可见性问题。大项目不能把所有函数都放在一个文件里。

`pub` 不是“导出一切”，而是有意识地公开稳定接口。

学习阶段可以用单文件 `mod`，真实项目通常拆到多个文件。
## 常见误区
- 函数放进模块后，如果没有 `pub`，外部无法调用。
- `use` 只是简化路径，不会改变所有权或可见性。
- package 和 crate 不是完全同义。一个 package 可以包含多个 crate。
## 进阶练习与参考答案
### 练习 1：新增字符串工具模块

要求：新增 `text` 模块，提供 `pub fn shout(value: &str) -> String`，返回大写并加感叹号。

参考答案：

```rust
mod text {
    pub fn shout(value: &str) -> String {
        format!("{}!", value.to_uppercase())
    }
}

println!("{}", text::shout("rust"));
```

解释：模块可以按功能分组。`pub` 让函数能被模块外调用。

### 练习 2：使用 use 简化路径

要求：把 `math::stats::average` 引入作用域，并直接调用。

参考答案：

```rust
use math::stats::average;

let data = [10.0, 20.0, 30.0];
println!("{}", average(&data));
```

解释：`use` 能减少重复路径，尤其适合频繁调用的函数或类型。
## 相关笔记
- [Rust学习笔记 09：常见集合类型](https://kylinxin.github.io/2026/04/09/Rust学习笔记-09-常见集合类型/)
- [Rust学习笔记 11：错误处理](https://kylinxin.github.io/2026/04/11/Rust学习笔记-11-错误处理/)
