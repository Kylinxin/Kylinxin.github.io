---
title: "Rust学习笔记 06：引用与切片"
date: 2026-04-06 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "引用"
abbrlink: "rust-note-06-references-slices"
---
对应代码文件：`src/bin/06_references_slices.rs`

运行命令：

```bash
cargo run --bin lesson06_references_slices
```

## 学习目标

本节继续所有权之后的主题：引用和切片。引用让你借用整个值，切片让你借用值的一部分。

切片不拥有数据，只描述一段连续区域。它常用于字符串、数组和 Vec 的只读访问。

- 理解 `&T` 和 `&mut T` 的含义。
- 知道切片 `&str`、`&[T]` 是借用的一段连续数据。
- 掌握字符串切片和数组切片的范围语法。
- 会通过缩小作用域减少借用冲突。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 引用 reference | 指向某个值的借用，不拥有该值。 | `&name` 是不可变引用。 |
| 可变引用 mutable reference | 可以修改借来的值。 | `&mut text` 必须配合可变变量使用。 |
| 切片 slice | 引用集合中连续的一部分。 | `&numbers[1..4]` 借用索引 1 到 3。 |
| 字符串切片 &str | 指向 UTF-8 字符串内容的一段视图。 | 字符串字面量的类型就是 `&str`。 |
| 范围 range | `start..end` 表示左闭右开区间。 | `0..5` 包含 0，不包含 5。 |

## 完整源码

```rust
fn first_word(text: &str) -> &str {
    // bytes() 逐字节遍历字符串。这里只处理 ASCII 空格边界。
    for (index, byte) in text.bytes().enumerate() {
        if byte == b' ' {
            return &text[..index];
        }
    }
    text
}

fn main() {
    let message = String::from("Rust ownership");

    // &message 创建不可变引用，可以读但不能改。
    let ref1 = &message;
    let ref2 = &message;
    println!("两个不可变引用: {ref1}, {ref2}");

    // 切片引用一段连续数据，不拥有数据。
    let word = first_word(&message);
    println!("第一个单词: {word}");

    let numbers = [10, 20, 30, 40, 50];
    let middle = &numbers[1..4];
    println!("数组切片: {middle:?}");

    let mut name = String::from("Rust");
    {
        // 可变引用的作用域越小，越容易避免借用冲突。
        let mutable_ref = &mut name;
        mutable_ref.push_str("acean");
    }
    println!("可变引用修改后: {name}");
}
```

## 运行与观察

使用 `cargo run --bin lesson06_references_slices` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 不可变引用

`let reference = &message;` 借用整个字符串并读取。

### 字符串切片

`&message[0..4]` 借用字符串前四个字节对应的内容。

### 数组切片

`&numbers[1..4]` 借用数组中一段连续元素。

### 可变引用作用域

把 `&mut text` 放进小代码块，让借用尽快结束。

## 专有词语详解

### 引用 reference

指向某个值的借用，不拥有该值。

`&name` 是不可变引用。

### 可变引用 mutable reference

可以修改借来的值。

`&mut text` 必须配合可变变量使用。

### 切片 slice

引用集合中连续的一部分。

`&numbers[1..4]` 借用索引 1 到 3。

### 字符串切片 &str

指向 UTF-8 字符串内容的一段视图。

字符串字面量的类型就是 `&str`。

### 范围 range

`start..end` 表示左闭右开区间。

`0..5` 包含 0，不包含 5。

## 初学者拓展

引用本身也有类型。`&String` 是借用一个 String，`&str` 是借用字符串内容的一段。

字符串切片索引按字节计算，不按人眼看到的字符计算。切到 UTF-8 字符中间会 panic。

切片常用于函数参数，因为它既避免复制，又能接受数组、Vec 或字符串的一部分。

当函数只读一段集合时，优先考虑 `&[T]`。当函数只读字符串时，优先考虑 `&str`。

## 常见误区

- 不要把切片当作拥有数据的新集合。它只是借用视图。
- 不要随便用字节索引切中文字符串。中文字符通常占多个字节。
- `&mut` 借用期间不要再创建其他引用。
- 函数参数写 `&String` 通常不如 `&str` 灵活。

## 进阶练习与参考答案

### 练习 1：提取首词

要求：写函数返回英文句子的第一个单词。

参考答案：

```rust
fn first_word(text: &str) -> &str {
    for (index, byte) in text.bytes().enumerate() {
        if byte == b' ' {
            return &text[..index];
        }
    }
    text
}

fn main() {
    println!("{}", first_word("Rust language"));
}
```

解释：返回值 `&str` 借用输入字符串的一部分，没有复制内容。

### 练习 2：数组切片求和

要求：写函数接收 `&[i32]` 并求和。

参考答案：

```rust
fn sum(values: &[i32]) -> i32 {
    let mut total = 0;
    for value in values {
        total += value;
    }
    total
}

fn main() {
    let numbers = [1, 2, 3, 4, 5];
    println!("{}", sum(&numbers[1..4]));
}
```

解释：`&[i32]` 可以接收数组或 Vec 的连续片段。

### 练习 3：缩小可变借用

要求：先修改字符串，再打印原字符串。

参考答案：

```rust
fn main() {
    let mut text = String::from("Rust");
    {
        let borrowed = &mut text;
        borrowed.push_str(" slice");
    }
    println!("{text}");
}
```

解释：可变引用离开内部作用域后，原变量可以再次使用。

## 相关笔记

- [Rust学习笔记 05：所有权与借用](https://kylinxin.github.io/2026/04/05/Rust学习笔记-05-所有权与借用/)
- [Rust学习笔记 07：结构体和方法](https://kylinxin.github.io/2026/04/07/Rust学习笔记-07-结构体和方法/)
