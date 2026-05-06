---
title: "Rust学习笔记 09：常见集合类型"
date: 2026-04-09 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "集合"
abbrlink: "rust-note-09-collections"
---
对应代码文件：`src/bin/09_collections.rs`

运行命令：

```bash
cargo run --bin lesson09_collections
```

## 学习目标

集合用于保存运行时数量可变的数据。本节重点是 `Vec`、`String` 和 `HashMap`。

集合通常把数据放在堆上，因此遍历、插入、借用时都会涉及所有权规则。

- 掌握 `Vec<T>` 的创建、追加和遍历。
- 理解 `String` 是可增长、拥有所有权的 UTF-8 字符串。
- 掌握 `HashMap<K, V>` 的插入、读取和更新。
- 知道集合遍历时 move、borrow、mutable borrow 的区别。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| Vec | 可增长数组，元素类型相同。 | 适合保存运行时长度变化的数据。 |
| String | 拥有所有权、可增长的 UTF-8 字符串。 | 适合拼接、修改和保存输入文本。 |
| HashMap | 键值对集合。 | 适合通过键快速查找值。 |
| 迭代器 iterator | 逐个产生元素的对象。 | `for` 循环背后就是迭代器。 |
| entry API | HashMap 的按键插入或更新接口。 | `entry(key).or_insert(value)` 常用于计数。 |

## 完整源码

```rust
use std::collections::HashMap;

fn main() {
    // Vec<T> 是可变长度数组，适合保存同类型列表。
    let mut numbers = vec![1, 2, 3];
    numbers.push(4);
    println!("Vec: {numbers:?}");

    for number in &numbers {
        println!("遍历 Vec: {number}");
    }

    // String 是 UTF-8 字符串，适合动态拼接文本。
    let mut text = String::from("Rust");
    text.push(' ');
    text.push_str("collections");
    println!("String: {text}");

    // HashMap<K, V> 保存键值对。
    let mut scores = HashMap::new();
    scores.insert(String::from("Alice"), 90);
    scores.insert(String::from("Bob"), 85);

    // entry 常用于“有则使用，无则插入”的逻辑。
    scores.entry(String::from("Alice")).or_insert(100);
    scores.entry(String::from("Carol")).or_insert(88);

    for (name, score) in &scores {
        println!("{name}: {score}");
    }
}
```

## 运行与观察

使用 `cargo run --bin lesson09_collections` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### Vec 操作

示例创建 `Vec`，用 `push` 追加数字，再遍历打印。

### 借用遍历

`for number in &numbers` 不移动 Vec，循环后仍能继续使用。

### String 拼接

`push_str` 追加字符串切片，修改原 `String`。

### HashMap

`scores.insert(name, score)` 插入键值对，`get` 返回 `Option<&V>`。

## 专有词语详解

### Vec

可增长数组，元素类型相同。

适合保存运行时长度变化的数据。

### String

拥有所有权、可增长的 UTF-8 字符串。

适合拼接、修改和保存输入文本。

### HashMap

键值对集合。

适合通过键快速查找值。

### 迭代器 iterator

逐个产生元素的对象。

`for` 循环背后就是迭代器。

### entry API

HashMap 的按键插入或更新接口。

`entry(key).or_insert(value)` 常用于计数。

## 初学者拓展

`Vec<T>` 中所有元素必须是同一种类型。如果需要多种情况，可考虑枚举。

`String` 和 `&str` 不同。`String` 拥有数据，`&str` 借用数据。

`HashMap` 的键需要能哈希和比较相等。常见键如 `String`、整数都可以。

`iter()` 借用元素，`iter_mut()` 可变借用元素，`into_iter()` 通常会消费集合。

## 常见误区

- 不要在持有集合元素引用时随意修改集合结构，可能触发借用冲突。
- `HashMap::get` 返回 `Option`，因为键可能不存在。
- 字符串按字节存储，处理中文字符时不要随意用数字索引。
- 遍历 `Vec<String>` 时，如果写 `for item in values`，通常会移动每个元素。

## 进阶练习与参考答案

### 练习 1：Vec 过滤

要求：从数字列表中收集所有偶数。

参考答案：

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6];
    let evens: Vec<i32> = numbers.iter().copied().filter(|n| n % 2 == 0).collect();
    println!("{:?}", evens);
}
```

解释：`iter()` 借用元素，`copied()` 把 `&i32` 转成 `i32`。

### 练习 2：词频统计

要求：统计字符串中每个单词出现次数。

参考答案：

```rust
use std::collections::HashMap;

fn main() {
    let text = "rust rust book";
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    println!("{:?}", counts);
}
```

解释：`entry` 返回对应键的位置，不存在时先插入 0。

### 练习 3：修改 Vec 元素

要求：把 Vec 中每个数字都乘以 10。

参考答案：

```rust
fn main() {
    let mut numbers = vec![1, 2, 3];
    for number in &mut numbers {
        *number *= 10;
    }
    println!("{:?}", numbers);
}
```

解释：`&mut numbers` 产生可变引用，`*number` 解引用后修改元素。

## 相关笔记

- [Rust学习笔记 08：枚举与模式匹配](https://kylinxin.github.io/2026/04/08/Rust学习笔记-08-枚举与模式匹配/)
- [Rust学习笔记 10：模块系统和包管理](https://kylinxin.github.io/2026/04/10/Rust学习笔记-10-模块系统和包管理/)
