---
title: "Rust学习笔记 14：生命周期"
date: 2026-04-14 09:00:00
updated: 2026-05-06 19:50:00
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

生命周期描述引用有效的范围。它让编译器确认引用不会指向已经释放的数据。

初学时不要把生命周期理解成手动控制内存。它只是对引用关系的标注和检查。

- 理解生命周期用于防止悬垂引用。
- 知道很多生命周期可以由编译器自动省略。
- 会读懂简单的 `'a` 标注。
- 理解结构体中保存引用时为什么需要生命周期参数。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 生命周期 lifetime | 引用保持有效的代码范围。 | `'a` 是生命周期参数名。 |
| 悬垂引用 dangling reference | 指向已经无效数据的引用。 | Rust 编译器会阻止它。 |
| 生命周期标注 | 显式说明多个引用之间的有效期关系。 | `fn longest<'a>(x: &'a str, y: &'a str) -> &'a str`。 |
| 生命周期省略 | 编译器按规则自动推断常见生命周期。 | 很多函数不需要手写 `'a`。 |
| 'static | 能存活整个程序运行期间的生命周期。 | 字符串字面量通常是 `&'static str`。 |

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

## 运行与观察

使用 `cargo run --bin lesson14_lifetimes` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 返回引用

函数返回引用时，编译器必须知道它来自哪个输入。

### longest

`longest<'a>` 表示返回值不会比两个输入引用中较短者活得更久。

### 结构体引用字段

结构体保存引用时，要在类型上标注生命周期。

### 字符串字面量

字面量存放在程序二进制中，常具有 `'static` 生命周期。

## 专有词语详解

### 生命周期 lifetime

引用保持有效的代码范围。

`'a` 是生命周期参数名。

### 悬垂引用 dangling reference

指向已经无效数据的引用。

Rust 编译器会阻止它。

### 生命周期标注

显式说明多个引用之间的有效期关系。

`fn longest<'a>(x: &'a str, y: &'a str) -> &'a str`。

### 生命周期省略

编译器按规则自动推断常见生命周期。

很多函数不需要手写 `'a`。

### 'static

能存活整个程序运行期间的生命周期。

字符串字面量通常是 `&'static str`。

## 初学者拓展

生命周期标注不会延长任何值的生命。它只是描述已有的有效范围。

`'a` 的名字没有特殊含义，可以叫 `'text`，但简单示例常用 `'a`。

返回引用时，返回值必须来自输入引用或其他足够长寿的数据，不能返回局部变量引用。

生命周期和所有权配合工作。拥有值的数据离开作用域后，指向它的引用不能继续存在。

## 常见误区

- 不要试图用生命周期标注修复真正的所有权错误。
- 不要返回函数内部创建的局部 `String` 的引用。
- `'static` 不等于“永远不释放所有数据”，它表示引用目标在整个程序期间有效。
- 生命周期报错通常说明引用关系不清楚，先画出数据拥有者和借用者。

## 进阶练习与参考答案

### 练习 1：实现 longest

要求：返回两个字符串切片中更长的一个。

参考答案：

```rust
fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() >= right.len() { left } else { right }
}

fn main() {
    println!("{}", longest("Rust", "language"));
}
```

解释：返回值可能来自任一输入，所以要用同一个生命周期参数描述关系。

### 练习 2：结构体保存引用

要求：定义保存标题引用的结构体。

参考答案：

```rust
struct Title<'a> {
    text: &'a str,
}

fn main() {
    let raw = String::from("Rust");
    let title = Title { text: &raw };
    println!("{}", title.text);
}
```

解释：结构体不能比它内部引用的字符串活得更久。

### 练习 3：避免返回局部引用

要求：修复返回局部字符串引用的错误。

参考答案：

```rust
fn make_title() -> String {
    String::from("Rust")
}

fn main() {
    let title = make_title();
    println!("{title}");
}
```

解释：函数内部创建的数据应返回所有权，而不是返回指向局部变量的引用。

## 相关笔记

- [Rust学习笔记 13：Trait 与 Trait Bound](https://kylinxin.github.io/2026/04/13/Rust学习笔记-13-Trait%20与%20Trait%20Bound/)
- [Rust学习笔记 15：常用标准库函数与实用宏](https://kylinxin.github.io/2026/04/15/Rust学习笔记-15-常用标准库函数与实用宏/)
