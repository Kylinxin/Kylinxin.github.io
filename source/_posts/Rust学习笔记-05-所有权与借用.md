---
title: "Rust学习笔记 05：所有权与借用"
date: 2026-04-05 09:00:00
updated: 2026-04-05 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "所有权"
abbrlink: "rust-note-05-ownership-borrowing"
---
对应代码文件：`src/bin/05_ownership_borrowing.rs`
运行命令：
```bash
cargo run --bin lesson05_ownership_borrowing
```
## 学习目标
本篇整理 Rust 的核心机制：所有权移动、不可变借用、可变借用和 Copy 类型。理解这一节是掌握 Rust 的关键。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
fn take_ownership(text: String) {
    // text 的所有权移动到函数里，函数结束后会释放。
    println!("接收所有权: {text}");
}

fn borrow_text(text: &String) {
    // &String 是不可变借用，不取得所有权。
    println!("借用文本: {text}");
}

fn change_text(text: &mut String) {
    // &mut String 是可变借用，同一时间只能有一个可变借用。
    text.push_str(" language");
}

fn main() {
    let owned = String::from("Rust");
    borrow_text(&owned);
    println!("借用后仍可使用: {owned}");

    take_ownership(owned);
    // 这里不能再使用 owned，因为所有权已经移动。

    let mut mutable_text = String::from("Rust");
    change_text(&mut mutable_text);
    println!("修改后: {mutable_text}");

    // Copy 类型（如整数）会复制值，不会发生所有权移动。
    let x = 5;
    let y = x;
    println!("x={x}, y={y}");
}
```
## 逐段解读
### 所有权移动

`take_ownership(text: String)` 接收 `String`，调用后所有权移动到函数中，原变量不能继续使用。

### 不可变借用

`borrow_text(text: &String)` 只借用值，不取得所有权。借用后原变量仍然可用。

### 可变借用

`change_text(text: &mut String)` 可以修改借来的值。同一时间只能有一个可变借用。

### Copy 类型

整数等简单类型实现了 `Copy`。`let y = x;` 会复制值，`x` 仍然可用。

### 资源清理

拥有值的变量离开作用域时，Rust 会自动释放资源，不需要手动 free。
## 初学者拓展
所有权解决“谁负责释放资源”的问题。每个值在同一时间只有一个所有者。

借用让函数临时使用值而不取得所有权。它是 Rust 既安全又高效的关键。

可变借用需要排他性，避免同时读写同一份数据导致不一致。
## 常见误区
- 把 `String` 传给接收所有权的函数后，原变量不能再用。
- 同一时间不能既有可变借用，又有其他不可变借用。
- 不要把 `&String` 和 `&str` 混淆。很多函数参数更推荐写成 `&str`。
## 进阶练习与参考答案
### 练习 1：避免所有权移动

要求：写一个函数打印字符串长度，但调用后原 `String` 仍可继续使用。

参考答案：

```rust
fn print_len(text: &String) {
    println!("长度: {}", text.len());
}

let name = String::from("Rust");
print_len(&name);
println!("仍可使用: {name}");
```

解释：函数参数使用引用 `&String`，只借用值，不移动所有权。

### 练习 2：限制可变借用作用域

要求：先用可变借用修改字符串，再在外部打印原字符串。

参考答案：

```rust
let mut text = String::from("Rust");
{
    let borrowed = &mut text;
    borrowed.push_str(" book");
}
println!("{text}");
```

解释：把可变借用放进小作用域，离开作用域后就可以再次使用原变量。
## 相关笔记
- [Rust学习笔记 04：流程控制](https://kylinxin.github.io/2026/04/04/Rust学习笔记-04-流程控制/)
- [Rust学习笔记 06：引用与切片](https://kylinxin.github.io/2026/04/06/Rust学习笔记-06-引用与切片/)
