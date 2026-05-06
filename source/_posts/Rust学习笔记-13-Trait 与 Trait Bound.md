---
title: "Rust学习笔记 13：Trait 与 Trait Bound"
date: 2026-04-13 09:00:00
updated: 2026-04-13 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "Trait"
abbrlink: "rust-note-13-traits-trait-bounds"
---
对应代码文件：`src/bin/13_traits_trait_bounds.rs`
运行命令：
```bash
cargo run --bin lesson13_traits_trait_bounds
```
## 学习目标
本篇整理 trait、默认方法、为类型实现 trait、trait bound 和 `impl Trait` 参数写法。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
trait Summary {
    fn summarize(&self) -> String;

    // trait 可以提供默认实现。
    fn source(&self) -> String {
        String::from("unknown")
    }
}

struct Article {
    title: String,
    author: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{} by {}", self.title, self.author)
    }

    fn source(&self) -> String {
        String::from("blog")
    }
}

fn print_summary<T: Summary>(item: &T) {
    // T: Summary 是 trait bound，表示 T 必须实现 Summary。
    println!("摘要: {}", item.summarize());
    println!("来源: {}", item.source());
}

fn notify(item: &impl Summary) {
    // impl Trait 是更简洁的参数写法。
    println!("通知: {}", item.summarize());
}

fn main() {
    let article = Article {
        title: String::from("Learning Rust"),
        author: String::from("Kylin"),
    };

    print_summary(&article);
    notify(&article);
}
```
## 逐段解读
### Trait 定义行为

`trait Summary` 定义“能生成摘要”的能力。类型实现它后，就能被统一处理。

### 默认实现

`fn source(&self) -> String` 提供默认实现。实现类型可以使用默认值，也可以覆盖。

### 实现 trait

`impl Summary for Article` 为 `Article` 提供具体的摘要行为。

### Trait bound

`fn print_summary<T: Summary>(item: &T)` 表示参数类型必须实现 `Summary`。

### impl Trait

`fn notify(item: &impl Summary)` 是更简洁的参数写法，适合简单场景。
## 初学者拓展
trait 类似“能力接口”。它描述类型能做什么，而不是类型内部长什么样。

trait bound 让泛型代码能调用某些方法，同时保留类型灵活性。

常见标准库 trait 包括 `Debug`、`Clone`、`Default`、`Iterator`。
## 常见误区
- 只有实现了 trait 的类型，才能传给带有对应 trait bound 的函数。
- 默认方法可以被覆盖。不要误以为所有实现都必须使用默认行为。
- `impl Trait` 简洁，但复杂泛型关系仍然需要显式泛型参数。
## 进阶练习与参考答案
### 练习 1：新增 Video 类型实现 Summary

要求：定义 `Video { title, duration }`，实现 `Summary`。

参考答案：

```rust
struct Video {
    title: String,
    duration: u32,
}

impl Summary for Video {
    fn summarize(&self) -> String {
        format!("{} ({} 秒)", self.title, self.duration)
    }
}
```

解释：不同类型可以实现同一个 trait，从而被同一套函数处理。

### 练习 2：要求两个参数都能摘要

要求：写函数接收两个实现 `Summary` 的参数，并分别打印摘要。

参考答案：

```rust
fn compare_summary<T: Summary, U: Summary>(left: &T, right: &U) {
    println!("左侧: {}", left.summarize());
    println!("右侧: {}", right.summarize());
}
```

解释：使用两个泛型参数能允许左右参数是不同类型，只要都实现 `Summary`。
## 相关笔记
- [Rust学习笔记 12：泛型](https://kylinxin.github.io/2026/04/12/Rust学习笔记-12-泛型/)
- [Rust学习笔记 14：生命周期](https://kylinxin.github.io/2026/04/14/Rust学习笔记-14-生命周期/)
