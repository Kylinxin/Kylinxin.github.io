---
title: "Rust学习笔记 11：错误处理"
date: 2026-04-11 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "错误处理"
abbrlink: "rust-note-11-error-handling"
---
对应代码文件：`src/bin/11_error_handling.rs`

运行命令：

```bash
cargo run --bin lesson11_error_handling
```

## 学习目标

Rust 把错误分成可恢复错误和不可恢复错误。可恢复错误通常用 `Result` 表达。

错误处理是 Rust 代码可读性的重要部分。你需要明确说明失败时程序应该如何反应。

- 理解 `Result<T, E>` 的含义。
- 会用 `match` 处理成功和失败。
- 掌握 `unwrap`、`expect` 的风险和适用场景。
- 理解 `?` 运算符如何传播错误。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| Result | 表示成功或失败的枚举。 | `Ok(T)` 是成功，`Err(E)` 是错误。 |
| panic | 不可恢复错误，程序通常终止当前线程。 | 适合违反程序假设的严重问题。 |
| unwrap | 取出 `Ok` 或 `Some` 的值，失败时 panic。 | 初学和测试可用，生产代码要谨慎。 |
| expect | 类似 unwrap，但可以提供 panic 信息。 | 比 `unwrap` 更容易定位原因。 |
| ? 运算符 | 成功时取值，失败时提前返回错误。 | 用于简化错误传播。 |

## 完整源码

```rust
use std::fs;
use std::io;

fn parse_number(text: &str) -> Result<i32, std::num::ParseIntError> {
    // ? 会在错误时提前返回 Err，在成功时取出 Ok 内的值。
    let value = text.trim().parse::<i32>()?;
    Ok(value)
}

fn read_config() -> Result<String, io::Error> {
    // 这里故意读取一个可能不存在的文件，用于演示错误传播。
    fs::read_to_string("config.txt")
}

fn main() {
    match parse_number("42") {
        Ok(value) => println!("解析成功: {value}"),
        Err(error) => println!("解析失败: {error}"),
    }

    match parse_number("not a number") {
        Ok(value) => println!("解析成功: {value}"),
        Err(error) => println!("解析失败: {error}"),
    }

    match read_config() {
        Ok(content) => println!("配置内容: {content}"),
        Err(error) => println!("读取配置失败，但程序继续运行: {error}"),
    }

    // panic! 用于不可恢复错误；普通业务错误更推荐 Result。
    println!("可恢复错误用 Result，不可恢复错误才考虑 panic!。");
}
```

## 运行与观察

使用 `cargo run --bin lesson11_error_handling` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 返回 Result

示例函数用 `Result<i32, String>` 表示可能成功也可能失败。

### match 处理

`match result` 分别处理 `Ok(value)` 和 `Err(message)`。

### expect

用于明确表达“这里失败就说明输入不符合预期”。

### ? 传播

在返回 Result 的函数中，`?` 可以减少嵌套匹配。

## 专有词语详解

### Result

表示成功或失败的枚举。

`Ok(T)` 是成功，`Err(E)` 是错误。

### panic

不可恢复错误，程序通常终止当前线程。

适合违反程序假设的严重问题。

### unwrap

取出 `Ok` 或 `Some` 的值，失败时 panic。

初学和测试可用，生产代码要谨慎。

### expect

类似 unwrap，但可以提供 panic 信息。

比 `unwrap` 更容易定位原因。

### ? 运算符

成功时取值，失败时提前返回错误。

用于简化错误传播。

## 初学者拓展

Rust 没有异常机制作为主路径。失败是类型的一部分，调用方必须面对。

`Result<T, E>` 中 `T` 是成功值类型，`E` 是错误值类型。

`?` 只能用于返回兼容错误类型的函数。它不是忽略错误，而是把错误交给上层。

库代码通常返回 `Result`，应用入口可以选择打印错误、重试或退出。

## 常见误区

- 不要在所有地方使用 `unwrap()`。它会让程序在错误输入时直接崩溃。
- `expect()` 的信息应该说明你假设了什么，而不是写空泛的 `error`。
- 使用 `?` 前确认当前函数返回 `Result` 或兼容类型。
- 不要吞掉错误。至少应该记录、返回或明确处理。

## 进阶练习与参考答案

### 练习 1：安全除法

要求：写函数处理除以零错误。

参考答案：

```rust
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("不能除以零"))
    } else {
        Ok(a / b)
    }
}

fn main() {
    match divide(10, 2) {
        Ok(value) => println!("{value}"),
        Err(error) => println!("错误: {error}"),
    }
}
```

解释：除数为 0 是可预期错误，用 `Result` 返回给调用方。

### 练习 2：用 ? 传播错误

要求：解析两个字符串并相加。

参考答案：

```rust
fn parse_sum(a: &str, b: &str) -> Result<i32, std::num::ParseIntError> {
    let left: i32 = a.parse()?;
    let right: i32 = b.parse()?;
    Ok(left + right)
}

fn main() {
    println!("{:?}", parse_sum("40", "2"));
}
```

解释：`?` 在解析失败时直接返回 `Err`，成功时取出数字。

### 练习 3：替换 unwrap

要求：把 `unwrap` 改成 `match` 处理。

参考答案：

```rust
fn main() {
    let raw = "abc";
    match raw.parse::<i32>() {
        Ok(value) => println!("{value}"),
        Err(error) => println!("解析失败: {error}"),
    }
}
```

解释：`match` 让失败路径也被明确写出来。

## 相关笔记

- [Rust学习笔记 10：模块系统和包管理](https://kylinxin.github.io/2026/04/10/Rust学习笔记-10-模块系统和包管理/)
- [Rust学习笔记 12：泛型](https://kylinxin.github.io/2026/04/12/Rust学习笔记-12-泛型/)
