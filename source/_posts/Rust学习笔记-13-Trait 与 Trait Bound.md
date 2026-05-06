---
title: "Rust学习笔记 13：Trait 与 Trait Bound"
date: 2026-04-13 09:00:00
updated: 2026-05-06 19:50:00
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

Trait 定义类型可以具备的行为。Trait bound 则约束泛型类型必须实现某些行为。

如果说泛型回答“我可以接收哪些类型”，trait bound 就回答“这些类型至少要会做什么”。

- 理解 trait 是行为接口。
- 会为自定义类型实现 trait。
- 会用 `impl Trait` 和 `<T: Trait>` 写参数。
- 知道标准库常见 trait，如 `Debug`、`Display`、`Clone`、`Copy`。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| Trait | 一组方法签名或默认实现。 | 类似“能力契约”，但不是类继承。 |
| 实现 impl | 为某个类型提供 trait 要求的方法。 | `impl Summary for Article`。 |
| Trait Bound | 泛型参数必须满足的 trait 约束。 | `T: Summary` 表示 T 必须能摘要。 |
| impl Trait | 参数或返回值位置的简写形式。 | `fn print(item: &impl Summary)`。 |
| 默认实现 | trait 中直接提供方法体。 | 实现者可以使用默认逻辑，也可以覆盖。 |

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

## 运行与观察

使用 `cargo run --bin lesson13_traits_trait_bounds` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 定义 trait

`trait Summary` 声明 `summarize` 行为。

### 实现 trait

不同结构体可以各自实现 `Summary`。

### Trait bound

`fn notify<T: Summary>(item: &T)` 接收任何能摘要的类型。

### 默认方法

trait 可以提供默认方法，减少重复实现。

## 专有词语详解

### Trait

一组方法签名或默认实现。

类似“能力契约”，但不是类继承。

### 实现 impl

为某个类型提供 trait 要求的方法。

`impl Summary for Article`。

### Trait Bound

泛型参数必须满足的 trait 约束。

`T: Summary` 表示 T 必须能摘要。

### impl Trait

参数或返回值位置的简写形式。

`fn print(item: &impl Summary)`。

### 默认实现

trait 中直接提供方法体。

实现者可以使用默认逻辑，也可以覆盖。

## 初学者拓展

Trait 表达共享行为，不表达共享字段。不同类型可以用完全不同的数据实现同一个行为。

`impl Trait` 简洁，适合简单参数。显式泛型 `<T: Trait>` 适合多个参数需要表达同一类型或多个约束。

一个类型可以实现多个 trait。一个函数也可以要求 `T: Summary + Clone`。

Rust 的 trait 遵循孤儿规则：通常只能为本地类型实现外部 trait，或为外部类型实现本地 trait。

## 常见误区

- 不要把 trait 当作父类。Trait 不保存实例字段。
- 泛型函数里调用 trait 方法前，必须写 trait bound。
- `Debug` 用于开发调试，`Display` 用于用户友好输出，两者不同。
- `Copy` 继承自 `Clone` 的语义，但只有轻量、按位复制安全的类型才应实现。

## 进阶练习与参考答案

### 练习 1：定义 Summary

要求：给文章类型实现摘要能力。

参考答案：

```rust
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("文章: {}", self.title)
    }
}

fn main() {
    let article = Article { title: String::from("Rust") };
    println!("{}", article.summarize());
}
```

解释：trait 只规定行为，具体格式由实现者决定。

### 练习 2：使用 trait bound

要求：写函数打印任何可摘要对象。

参考答案：

```rust
fn print_summary<T: Summary>(item: &T) {
    println!("{}", item.summarize());
}
```

解释：`T: Summary` 让函数内部可以安全调用 `summarize`。

### 练习 3：多个约束

要求：写函数要求参数既能摘要又能克隆。

参考答案：

```rust
fn duplicate_summary<T>(item: &T) -> String
where
    T: Summary + Clone,
{
    let copied = item.clone();
    copied.summarize()
}
```

解释：`where` 子句适合约束较多时提高可读性。

## 相关笔记

- [Rust学习笔记 12：泛型](https://kylinxin.github.io/2026/04/12/Rust学习笔记-12-泛型/)
- [Rust学习笔记 14：生命周期](https://kylinxin.github.io/2026/04/14/Rust学习笔记-14-生命周期/)
