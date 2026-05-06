---
title: "Rust学习笔记 12：泛型"
date: 2026-04-12 09:00:00
updated: 2026-05-06 19:50:00
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

泛型让同一段代码适用于多种类型。它能减少重复，同时保持静态类型检查。

Rust 的泛型在编译期单态化，常见情况下不会带来运行时动态分发开销。

- 理解泛型参数 `T` 的含义。
- 会定义泛型函数和泛型结构体。
- 知道泛型需要 trait bound 才能使用特定能力。
- 理解 `Option<T>`、`Result<T, E>` 也是泛型类型。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 泛型 generic | 把具体类型抽象成类型参数。 | `fn identity<T>(value: T) -> T` 可接收多种类型。 |
| 类型参数 T | 泛型中的占位类型名。 | `T` 不是固定名字，只是惯例。 |
| 单态化 monomorphization | 编译器为实际类型生成具体版本。 | 这是 Rust 泛型高性能的原因之一。 |
| 泛型结构体 | 字段类型带类型参数的结构体。 | `Point<T>` 可表示整数点或浮点点。 |
| trait bound | 限制泛型类型必须具备某些能力。 | 下一节会详细讲。 |

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

## 运行与观察

使用 `cargo run --bin lesson12_generics` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 泛型函数

`fn identity<T>(value: T) -> T` 接收什么类型就返回什么类型。

### 泛型结构体

`struct Pair<T>` 用同一种 `T` 保存两个值。

### 多个泛型参数

`Result<T, E>` 同时有成功值类型和错误类型。

### 约束需求

如果要比较、打印或相加泛型值，就必须添加相应 trait bound。

## 专有词语详解

### 泛型 generic

把具体类型抽象成类型参数。

`fn identity<T>(value: T) -> T` 可接收多种类型。

### 类型参数 T

泛型中的占位类型名。

`T` 不是固定名字，只是惯例。

### 单态化 monomorphization

编译器为实际类型生成具体版本。

这是 Rust 泛型高性能的原因之一。

### 泛型结构体

字段类型带类型参数的结构体。

`Point<T>` 可表示整数点或浮点点。

### trait bound

限制泛型类型必须具备某些能力。

下一节会详细讲。

## 初学者拓展

泛型不是“任意类型随便用”。没有约束时，你只能移动、返回或保存它，不能随便比较或打印。

`T`、`U`、`E` 只是类型参数名字。`E` 常用来表示 error 类型。

泛型能把“算法结构”从“具体数据类型”中分离出来。

当两个字段都写 `T` 时，它们必须是同一具体类型。需要不同类型时写 `T, U`。

## 常见误区

- 不要以为泛型函数内部自动知道 `T` 能打印。打印需要 `T: Debug` 或 `T: Display`。
- 如果结构体字段一个是整数、一个是浮点数，就不要都写成同一个 `T`。
- 泛型参数过多会降低可读性。初学阶段先保持简单。
- 泛型解决重复类型逻辑，不适合掩盖完全不同的业务概念。

## 进阶练习与参考答案

### 练习 1：identity 函数

要求：写一个返回原值的泛型函数。

参考答案：

```rust
fn identity<T>(value: T) -> T {
    value
}

fn main() {
    println!("{}", identity(10));
    println!("{}", identity("Rust"));
}
```

解释：`T` 由调用时传入的值推断出来。

### 练习 2：泛型结构体

要求：定义 `Point<T>` 并创建整数点和浮点点。

参考答案：

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let int_point = Point { x: 1, y: 2 };
    let float_point = Point { x: 1.0, y: 2.0 };
    println!("{} {}", int_point.x, float_point.y);
}
```

解释：同一个结构体模板可以生成不同具体类型。

### 练习 3：两个类型参数

要求：定义 `Pair<T, U>` 保存不同类型。

参考答案：

```rust
struct Pair<T, U> {
    left: T,
    right: U,
}

fn main() {
    let pair = Pair { left: "age", right: 20 };
    println!("{} {}", pair.left, pair.right);
}
```

解释：`T` 和 `U` 允许两个字段拥有不同类型。

## 相关笔记

- [Rust学习笔记 11：错误处理](https://kylinxin.github.io/2026/04/11/Rust学习笔记-11-错误处理/)
- [Rust学习笔记 13：Trait 与 Trait Bound](https://kylinxin.github.io/2026/04/13/Rust学习笔记-13-Trait%20与%20Trait%20Bound/)
