---
title: "Rust学习笔记 08：枚举与模式匹配"
date: 2026-04-08 09:00:00
updated: 2026-04-08 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "枚举"
abbrlink: "rust-note-08-enums-pattern-matching"
---
对应代码文件：`src/bin/08_enums_pattern_matching.rs`
运行命令：
```bash
cargo run --bin lesson08_enums_pattern_matching
```
## 学习目标
本篇整理枚举、不同形态的枚举变体、`match`、`if let`、多模式匹配和通配分支。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
#[derive(Debug)]
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(u8, u8, u8),
}

fn handle_message(message: Message) {
    // match 必须覆盖所有可能情况，因此很适合处理枚举。
    match message {
        Message::Quit => println!("退出"),
        Message::Move { x, y } => println!("移动到 ({x}, {y})"),
        Message::Write(text) => println!("写入: {text}"),
        Message::ChangeColor(r, g, b) => println!("颜色: rgb({r}, {g}, {b})"),
    }
}

fn main() {
    handle_message(Message::Move { x: 3, y: 4 });
    handle_message(Message::Write(String::from("hello")));
    handle_message(Message::Quit);
    handle_message(Message::ChangeColor(255, 128, 0));

    let maybe_score = Some(95);
    if let Some(score) = maybe_score {
        // if let 适合只关心一种匹配情况。
        println!("成绩存在: {score}");
    }

    let value = 2;
    match value {
        1 => println!("one"),
        2 | 3 => println!("two or three"),
        _ => println!("other"),
    }
}
```
## 逐段解读
### 枚举定义

`enum Message` 定义一组可能消息。每个变体可以没有数据、具名字段、元组字段或 String。

### match 覆盖

`match message` 必须覆盖所有变体。这样新增情况时，编译器会提醒你处理。

### 解构枚举

`Message::Move { x, y }` 在匹配时直接取出字段。

### if let

`if let Some(score) = maybe_score` 适合只关心一种匹配情况。

### 多模式

`2 | 3` 表示匹配 2 或 3。`_` 是兜底分支。
## 初学者拓展
枚举适合表达“一个值只能是几种情况之一”。例如消息、状态、结果都适合用枚举。

`Option<T>` 和 `Result<T, E>` 都是标准库枚举。后续错误处理会大量使用它们。

`match` 的穷尽性检查是 Rust 安全性的一个重要来源。
## 常见误区
- `match` 必须覆盖所有情况。缺少分支会编译失败。
- `if let` 简洁，但如果需要处理多个分支，`match` 更清楚。
- 枚举中包含 `String` 时，匹配取值可能发生所有权移动。
## 进阶练习与参考答案
### 练习 1：增加登录消息

要求：给 `Message` 增加 `Login { user: String }`，并在 `handle_message` 中打印用户名。

参考答案：

```rust
enum Message {
    Login { user: String },
    // 其他变体省略
}

match message {
    Message::Login { user } => println!("用户登录: {user}"),
    _ => println!("其他消息"),
}
```

解释：新增枚举变体后，`match` 需要同步处理。编译器会帮你发现遗漏。

### 练习 2：用 match 处理 Option

要求：把 `Some(95)` 和 `None` 都处理掉，分别打印成绩或缺考。

参考答案：

```rust
let score = Some(95);
match score {
    Some(value) => println!("成绩: {value}"),
    None => println!("缺考"),
}
```

解释：`Option` 强制你处理“没有值”的情况，避免空值错误。
## 相关笔记
- [Rust学习笔记 07：结构体和方法](https://kylinxin.github.io/2026/04/07/Rust学习笔记-07-结构体和方法/)
- [Rust学习笔记 09：常见集合类型](https://kylinxin.github.io/2026/04/09/Rust学习笔记-09-常见集合类型/)
