---
title: "Rust学习笔记 07：结构体和方法"
date: 2026-04-07 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "结构体"
abbrlink: "rust-note-07-structs-methods"
---
对应代码文件：`src/bin/07_structs_methods.rs`

运行命令：

```bash
cargo run --bin lesson07_structs_methods
```

## 学习目标

结构体用于把相关数据组合成有名字的类型。方法则把和这个类型相关的行为放在一起。

Rust 没有传统面向对象里的类，但结构体加 `impl` 可以表达清晰的数据和行为边界。

- 掌握命名字段结构体的定义和创建。
- 理解字段访问、结构体更新语法和派生调试输出。
- 掌握 `impl`、方法和关联函数。
- 区分 `self`、`&self` 和 `&mut self`。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 结构体 struct | 把多个字段组合成一个自定义类型。 | `User { name, active }` 表示一个用户对象。 |
| 字段 field | 结构体内部的命名数据。 | `user.name` 访问 `name` 字段。 |
| 方法 method | 定义在 `impl` 中，第一个参数是 `self` 相关形式的函数。 | `user.summary()` 是方法调用。 |
| 关联函数 associated function | 定义在 `impl` 中，但不接收 `self`。 | 常用于构造函数，如 `User::new()`。 |
| derive | 让编译器自动生成常见能力。 | `#[derive(Debug)]` 允许用 `{:?}` 打印。 |

## 完整源码

```rust
#[derive(Debug)]
struct User {
    username: String,
    email: String,
    active: bool,
}

impl User {
    // 关联函数不接收 self，常用于构造值。
    fn new(username: &str, email: &str) -> Self {
        Self {
            username: username.to_string(),
            email: email.to_string(),
            active: true,
        }
    }

    // 方法的第一个参数是 &self，用于读取实例数据。
    fn summary(&self) -> String {
        format!("{} <{}>", self.username, self.email)
    }

    // &mut self 方法可以修改实例。
    fn deactivate(&mut self) {
        self.active = false;
    }
}

fn main() {
    let mut user = User::new("kylin", "kylin@example.com");
    println!("用户: {}", user.summary());

    user.deactivate();
    println!("停用后: {user:?}");

    // 结构体更新语法可以复用已有字段。
    let another = User {
        username: "rustacean".to_string(),
        ..user
    };
    println!("新用户: {another:?}");
}
```

## 运行与观察

使用 `cargo run --bin lesson07_structs_methods` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 定义结构体

`struct User` 定义 `name`、`email`、`active` 等字段。

### 创建实例

`User { ... }` 给每个字段赋值，得到具体用户。

### 实现方法

`impl User` 中的 `summary(&self)` 读取字段并返回字符串。

### 可变方法

`deactivate(&mut self)` 修改用户状态，需要可变实例。

## 专有词语详解

### 结构体 struct

把多个字段组合成一个自定义类型。

`User { name, active }` 表示一个用户对象。

### 字段 field

结构体内部的命名数据。

`user.name` 访问 `name` 字段。

### 方法 method

定义在 `impl` 中，第一个参数是 `self` 相关形式的函数。

`user.summary()` 是方法调用。

### 关联函数 associated function

定义在 `impl` 中，但不接收 `self`。

常用于构造函数，如 `User::new()`。

### derive

让编译器自动生成常见能力。

`#[derive(Debug)]` 允许用 `{:?}` 打印。

## 初学者拓展

`&self` 是 `self: &Self` 的简写，表示方法只借用实例。

`&mut self` 表示方法会修改实例。调用它的变量必须是 `mut`。

`self` 表示方法取得实例所有权。调用后原实例通常不能再使用。

结构体更新语法 `..other` 可能移动未 Copy 字段的所有权，使用时要注意后续是否还要用原实例。

## 常见误区

- 不要忘记给需要修改的实例写 `let mut user`。
- 不要把关联函数和方法混淆。有关联函数用 `Type::function()` 调用。
- `Debug` 输出适合调试，不等同于面向用户的格式化文本。
- 字段可见性默认私有。模块章节会进一步讲 `pub`。

## 进阶练习与参考答案

### 练习 1：定义书籍结构体

要求：定义 `Book`，包含标题、作者、页数，并写摘要方法。

参考答案：

```rust
#[derive(Debug)]
struct Book {
    title: String,
    author: String,
    pages: u32,
}

impl Book {
    fn summary(&self) -> String {
        format!("《{}》 by {}, {} 页", self.title, self.author, self.pages)
    }
}

fn main() {
    let book = Book { title: String::from("Rust Book"), author: String::from("Steve"), pages: 500 };
    println!("{}", book.summary());
}
```

解释：`summary(&self)` 只读取字段，所以不需要取得所有权。

### 练习 2：写构造函数

要求：为 `Book` 增加 `new` 关联函数。

参考答案：

```rust
struct Book {
    title: String,
    pages: u32,
}

impl Book {
    fn new(title: &str, pages: u32) -> Self {
        Self { title: title.to_string(), pages }
    }
}

fn main() {
    let book = Book::new("Rust", 300);
    println!("{} {}", book.title, book.pages);
}
```

解释：`Self` 表示当前实现块对应的类型，也就是 `Book`。

### 练习 3：修改字段

要求：写方法把任务状态改为完成。

参考答案：

```rust
struct Task {
    title: String,
    done: bool,
}

impl Task {
    fn finish(&mut self) {
        self.done = true;
    }
}

fn main() {
    let mut task = Task { title: String::from("learn struct"), done: false };
    task.finish();
    println!("{} {}", task.title, task.done);
}
```

解释：方法要修改字段，所以接收 `&mut self`，变量也要声明为 `mut`。

## 相关笔记

- [Rust学习笔记 06：引用与切片](https://kylinxin.github.io/2026/04/06/Rust学习笔记-06-引用与切片/)
- [Rust学习笔记 08：枚举与模式匹配](https://kylinxin.github.io/2026/04/08/Rust学习笔记-08-枚举与模式匹配/)
