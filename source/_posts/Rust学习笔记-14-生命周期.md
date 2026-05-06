---
title: "Rust学习笔记 14：生命周期"
date: 2026-04-14 09:00:00
updated: 2026-04-14 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "生命周期"
abbrlink: "rust-note-14-lifetimes"
---
对应代码文件：`src/bin/14_lifetimes.rs`
运行命令：
```bash
cargo run --bin lesson14_lifetimes
```
## 学习目标
本篇整理生命周期标注、返回引用的有效期、结构体中保存引用，以及生命周期省略规则的直觉。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    // 生命周期标注说明：返回引用的有效期不超过两个输入引用中较短的那个。
    if left.len() >= right.len() {
        left
    } else {
        right
    }
}

struct ImportantExcerpt<'a> {
    // 结构体保存引用时，需要说明引用必须活得和结构体一样久。
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("通知: {announcement}");
        self.part
    }
}

fn main() {
    let first = String::from("short");
    let second = String::from("a longer string");
    let result = longest(&first, &second);
    println!("更长的是: {result}");

    let novel = String::from("Rust is safe. Rust is fast.");
    let first_sentence = novel.split('.').next().unwrap_or("");
    let excerpt = ImportantExcerpt {
        part: first_sentence,
    };
    println!("摘录: {}", excerpt.announce_and_return_part("开始阅读"));
}
```
## 逐段解读
### 生命周期参数

`fn longest<'a>(left: &'a str, right: &'a str) -> &'a str` 表示返回引用和两个输入引用有关。

### 有效期约束

`'a` 描述的是约束关系，不是延长生命周期。返回引用不能比输入引用活得更久。

### 结构体引用字段

`struct ImportantExcerpt<'a>` 表示结构体中的 `part` 引用必须至少和结构体实例一样有效。

### 方法中的生命周期

`impl<'a>` 为带生命周期的结构体实现方法。

### 临时安全

示例中 `first_sentence` 引用 `novel`，因此 `novel` 必须在 `excerpt` 使用期间保持有效。
## 初学者拓展
生命周期不是让值活得更久，而是让编译器知道引用之间的有效期关系。

多数简单函数不需要手写生命周期，因为编译器有省略规则。

当函数返回引用，并且返回值可能来自多个输入引用时，通常需要显式生命周期。
## 常见误区
- 不要返回指向函数内部局部 `String` 的 `&str`，局部变量离开函数就被释放。
- 生命周期标注不能修复悬垂引用，只能描述合法引用关系。
- 结构体保存引用时，通常需要生命周期参数。
## 进阶练习与参考答案
### 练习 1：返回更短字符串

要求：写 `shortest<'a>(left: &'a str, right: &'a str) -> &'a str`。

参考答案：

```rust
fn shortest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() <= right.len() {
        left
    } else {
        right
    }
}
```

解释：`shortest` 和 `longest` 的生命周期关系相同，只是比较逻辑相反。

### 练习 2：结构体保存标题引用

要求：定义 `BookTitle<'a> { title: &'a str }`，并打印标题。

参考答案：

```rust
struct BookTitle<'a> {
    title: &'a str,
}

let name = String::from("Rust Book");
let book = BookTitle { title: &name };
println!("{}", book.title);
```

解释：`book` 保存了对 `name` 的引用，所以 `name` 必须比 `book` 使用时间更长。
## 相关笔记
- [Rust学习笔记 13：Trait 与 Trait Bound](https://kylinxin.github.io/2026/04/13/Rust学习笔记-13-Trait%20与%20Trait%20Bound/)
- [Rust学习笔记 15：常用标准库函数与实用宏](https://kylinxin.github.io/2026/04/15/Rust学习笔记-15-常用标准库函数与实用宏/)
