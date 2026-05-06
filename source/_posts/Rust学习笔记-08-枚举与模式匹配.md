---
title: "Rust学习笔记 08：枚举与模式匹配"
date: 2026-04-08 09:00:00
updated: 2026-05-06 19:50:00
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

枚举用于表达一个值可能属于有限几种情况。模式匹配用于根据具体情况分支处理。

Rust 的 `Option` 和 `Result` 都是枚举。掌握枚举后，错误处理和空值处理会更自然。

- 掌握 `enum` 的基本定义。
- 理解枚举变体可以携带数据。
- 会使用 `match` 穷尽处理所有情况。
- 会使用 `if let` 简化只关心一种情况的代码。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 枚举 enum | 定义一组互斥的可能情况。 | `Direction` 可以是 Up、Down、Left、Right。 |
| 变体 variant | 枚举中的某一个具体情况。 | `Message::Text(String)` 是一个变体。 |
| 模式 pattern | 用于匹配数据结构形状的写法。 | `Some(value)` 匹配有值的 Option。 |
| match | 穷尽式分支表达式。 | 所有可能情况都必须处理。 |
| Option | 表示有值或没有值。 | `Some(T)` 有值，`None` 无值。 |

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

## 运行与观察

使用 `cargo run --bin lesson08_enums_pattern_matching` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 定义枚举

`enum Direction` 把方向限制在几个合法值中。

### 携带数据

枚举变体可以保存不同类型的数据，例如文本消息或移动坐标。

### match 分支

`match direction` 对每个方向分别处理。

### if let

只关心 `Some` 或某个变体时，`if let` 更简洁。

## 专有词语详解

### 枚举 enum

定义一组互斥的可能情况。

`Direction` 可以是 Up、Down、Left、Right。

### 变体 variant

枚举中的某一个具体情况。

`Message::Text(String)` 是一个变体。

### 模式 pattern

用于匹配数据结构形状的写法。

`Some(value)` 匹配有值的 Option。

### match

穷尽式分支表达式。

所有可能情况都必须处理。

### Option

表示有值或没有值。

`Some(T)` 有值，`None` 无值。

## 初学者拓展

`match` 是表达式，每个分支可以返回值，但返回类型需要一致。

枚举比字符串状态更安全。字符串可能拼错，枚举变体会被编译器检查。

`Option<T>` 避免空指针。你必须明确处理 `Some` 和 `None`。

`_` 是通配模式，表示其他所有情况。它方便，但不要用它隐藏应该明确处理的分支。

## 常见误区

- 不要用普通字符串表示有限状态，优先考虑枚举。
- `match` 必须穷尽，否则无法编译。
- 匹配含有 `String` 的枚举时要注意所有权移动。
- 滥用 `_` 会降低代码可维护性。新增变体时编译器可能无法提醒你。

## 进阶练习与参考答案

### 练习 1：定义交通灯

要求：定义 `TrafficLight`，用 `match` 返回等待秒数。

参考答案：

```rust
enum TrafficLight {
    Red,
    Yellow,
    Green,
}

fn wait_seconds(light: TrafficLight) -> u8 {
    match light {
        TrafficLight::Red => 60,
        TrafficLight::Yellow => 3,
        TrafficLight::Green => 0,
    }
}

fn main() {
    println!("{}", wait_seconds(TrafficLight::Red));
}
```

解释：枚举让交通灯状态只能取合法变体。

### 练习 2：处理 Option

要求：写函数把 `Option<i32>` 中的数字加一。

参考答案：

```rust
fn plus_one(value: Option<i32>) -> Option<i32> {
    match value {
        Some(number) => Some(number + 1),
        None => None,
    }
}

fn main() {
    println!("{:?}", plus_one(Some(5)));
}
```

解释：`Option` 必须同时处理有值和无值。

### 练习 3：使用 if let

要求：只在 `Some` 时打印用户名。

参考答案：

```rust
fn main() {
    let user = Some("Kylin");
    if let Some(name) = user {
        println!("用户: {name}");
    }
}
```

解释：`if let` 适合只关心一个模式的场景。

## 相关笔记

- [Rust学习笔记 07：结构体和方法](https://kylinxin.github.io/2026/04/07/Rust学习笔记-07-结构体和方法/)
- [Rust学习笔记 09：常见集合类型](https://kylinxin.github.io/2026/04/09/Rust学习笔记-09-常见集合类型/)
