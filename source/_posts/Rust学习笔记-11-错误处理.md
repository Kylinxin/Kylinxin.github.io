---
title: "Rust学习笔记 11：错误处理"
date: 2026-04-11 09:00:00
updated: 2026-04-11 09:00:00
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
本篇整理 Rust 错误处理：`Result`、`Ok`、`Err`、`?`、`match`、可恢复错误和 `panic!` 的边界。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
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
## 逐段解读
### Result

`Result<i32, ParseIntError>` 表示成功时得到 `i32`，失败时得到解析错误。

### 问号运算符

`?` 在成功时取出 `Ok` 的值，在失败时提前返回 `Err`。

### IO 错误

`fs::read_to_string` 返回 `Result<String, io::Error>`，文件不存在时不会直接崩溃。

### match 处理错误

`match` 分别处理 `Ok` 和 `Err`，让错误路径显式可见。

### panic

`panic!` 用于不可恢复错误。普通业务失败更推荐 `Result`。
## 初学者拓展
Rust 不使用异常作为主要错误处理机制，而是把错误放进类型系统。

`Result` 迫使调用者处理失败情况，适合文件、网络、解析等可能失败的操作。

`?` 只能用在返回 `Result`、`Option` 等兼容类型的函数里。
## 常见误区
- 不要用 `unwrap()` 处理正常业务错误。它会在失败时 panic。
- `?` 不是忽略错误，而是把错误返回给调用者。
- 不要把所有错误都 `panic!`。可恢复错误应该返回 `Result`。
## 进阶练习与参考答案
### 练习 1：解析并加倍

要求：写 `parse_and_double(text: &str) -> Result<i32, ParseIntError>`，解析整数并返回两倍。

参考答案：

```rust
fn parse_and_double(text: &str) -> Result<i32, std::num::ParseIntError> {
    let value = text.trim().parse::<i32>()?;
    Ok(value * 2)
}
```

解释：`?` 让解析失败时直接返回错误，成功时继续计算。

### 练习 2：为读取配置提供默认值

要求：读取 `config.txt`，失败时使用默认字符串 `"default"`。

参考答案：

```rust
let config = fs::read_to_string("config.txt")
    .unwrap_or_else(|_| String::from("default"));
println!("{config}");
```

解释：`unwrap_or_else` 只在失败时执行闭包，适合构造默认值。
## 相关笔记
- [Rust学习笔记 10：模块系统和包管理](https://kylinxin.github.io/2026/04/10/Rust学习笔记-10-模块系统和包管理/)
- [Rust学习笔记 12：泛型](https://kylinxin.github.io/2026/04/12/Rust学习笔记-12-泛型/)
