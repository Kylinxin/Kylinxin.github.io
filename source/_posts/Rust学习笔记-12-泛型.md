---
title: "Rust学习笔记 12：泛型"
date: 2026-04-12 09:00:00
updated: 2026-04-12 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "泛型"
abbrlink: "rust-note-12-generics"
---
对应代码文件：`src/bin/12_generics.rs`
运行命令：
```bash
cargo run --bin lesson12_generics
```
## 学习目标
本篇整理泛型函数、泛型结构体、`impl<T>`、trait bound，以及如何让同一段代码适配多种类型。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
fn largest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut largest = items[0];
    for &item in items {
        if item > largest {
            largest = item;
        }
    }
    largest
}

#[derive(Debug)]
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

fn main() {
    let numbers = [3, 8, 2, 10];
    println!("最大数字: {}", largest(&numbers));

    let chars = ['a', 'z', 'm'];
    println!("最大字符: {}", largest(&chars));

    let integer_point = Point { x: 3, y: 4 };
    let float_point = Point { x: 1.2, y: 3.4 };
    println!("整数点: {integer_point:?}, x={}", integer_point.x());
    println!("浮点点: {float_point:?}, y={}", float_point.y);
}
```
## 逐段解读
### 泛型函数

`fn largest<T: PartialOrd + Copy>(items: &[T]) -> T` 用类型参数 `T` 表示可复用的类型。

### Trait bound

`PartialOrd + Copy` 限制 `T` 必须能比较大小并能复制。

### 泛型结构体

`struct Point<T>` 表示 `x` 和 `y` 使用同一个泛型类型。

### 泛型 impl

`impl<T> Point<T>` 为所有 `Point<T>` 实现方法。

### 返回引用

`fn x(&self) -> &T` 返回字段引用，避免移动字段。
## 初学者拓展
泛型减少重复代码。你可以写一次逻辑，让它适用于整数、字符或自定义类型。

泛型不是“任意类型都可以”。trait bound 决定类型必须具备哪些能力。

Rust 泛型在编译期单态化，通常没有运行时动态开销。
## 常见误区
- 如果泛型值需要比较，必须加 `PartialOrd` 等约束。
- 如果要从切片中返回值，非 Copy 类型不能直接复制返回。
- `Point<T>` 要求 x 和 y 类型相同。如果要不同类型，需要 `Point<T, U>`。
## 进阶练习与参考答案
### 练习 1：支持不同类型坐标

要求：定义 `Point<T, U>`，让 x 和 y 可以是不同类型。

参考答案：

```rust
#[derive(Debug)]
struct Point<T, U> {
    x: T,
    y: U,
}

let point = Point { x: 3, y: 4.5 };
println!("{point:?}");
```

解释：两个泛型参数能表达两个字段的类型可以不同。

### 练习 2：返回切片中最小值

要求：写 `smallest<T: PartialOrd + Copy>(items: &[T]) -> T`。

参考答案：

```rust
fn smallest<T: PartialOrd + Copy>(items: &[T]) -> T {
    let mut smallest = items[0];
    for &item in items {
        if item < smallest {
            smallest = item;
        }
    }
    smallest
}
```

解释：逻辑和 `largest` 类似，只是比较方向变成 `<`。
## 相关笔记
- [Rust学习笔记 11：错误处理](https://kylinxin.github.io/2026/04/11/Rust学习笔记-11-错误处理/)
- [Rust学习笔记 13：Trait 与 Trait Bound](https://kylinxin.github.io/2026/04/13/Rust学习笔记-13-Trait 与 Trait Bound/)
