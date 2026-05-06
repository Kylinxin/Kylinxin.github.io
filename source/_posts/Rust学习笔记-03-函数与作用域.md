---
title: "Rust学习笔记 03：函数与作用域"
date: 2026-05-06 19:11:02
updated: 2026-05-06 19:11:02
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "函数"
abbrlink: "rust-note-03-functions-scope"
---

本篇对应 `src/bin/03_functions_scope.rs`，重点整理 Rust 函数定义、参数类型、返回值、表达式、语句和作用域。

运行命令：

```bash
cargo run --bin lesson03_functions_scope
```

## 完整源码

```rust
fn add(a: i32, b: i32) -> i32 {
    // 没有分号的最后一个表达式会作为返回值。
    a + b
}

fn print_title(title: &str) {
    // 参数类型必须显式声明。
    println!("== {title} ==");
}

fn main() {
    print_title("函数与作用域");
    let result = add(3, 5);
    println!("3 + 5 = {result}");

    // 花括号会创建新的作用域，内部变量离开作用域后失效。
    let outer = 10;
    {
        let inner = 20;
        println!("内部可以访问 outer={outer}, inner={inner}");
    }
    // 这里不能再访问 inner，因为它已经离开作用域。

    // 块也是表达式，可以把计算结果赋给变量。
    let doubled = {
        let value = 7;
        value * 2
    };
    println!("块表达式结果: {doubled}");
}
```

## 逐段解读

`fn add(a: i32, b: i32) -> i32` 定义函数。`a` 和 `b` 是参数，`-> i32` 是返回值类型。

Rust 要求函数参数必须写类型。这样编译器能在编译阶段检查函数调用是否正确。

`a + b` 没有分号，所以它是返回表达式。Rust 会把它作为 `add` 函数的返回值。

`fn print_title(title: &str)` 没有写返回值类型，表示返回 `()`。`()` 代表没有有意义的返回值。

`&str` 是字符串切片引用。初学时可以理解为“借用一段字符串文本”。

`main` 是程序入口。运行这个二进制程序时，Rust 从 `main` 开始执行。

内部花括号 `{ ... }` 创建新作用域。内部可以访问外部变量 `outer`，但外部不能访问内部变量 `inner`。

`let doubled = { let value = 7; value * 2 };` 展示块表达式。块最后一行无分号，所以整个块返回 `14`。

## 初学者拓展

Rust 区分表达式和语句。表达式产生值，语句执行动作。

`a + b` 是表达式。`let x = 1;` 是语句。给表达式加上分号，通常会让它变成语句。

作用域是后面学习所有权的基础。变量离开作用域时，Rust 会自动清理它拥有的资源。

## 常见误区

不要在返回表达式后随手加分号。如果函数声明返回 `i32`，最后写成 `a + b;` 会报错。

不要以为内部作用域变量在外面还能用。变量有效范围由花括号决定。

不要忽略 `&str` 中的 `&`。它表示引用，后续学习借用时会非常重要。

## 进阶练习与参考答案

### 练习 1：新增乘法函数并复用返回值

要求：新增 `multiply(a: i32, b: i32) -> i32`，在 `main` 中计算 `(3 + 5) * 2`。

参考答案：

```rust
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    let sum = add(3, 5);
    let result = multiply(sum, 2);
    println!("最终结果: {result}");
}
```

解释：函数返回值可以继续作为另一个函数的参数。这里先用 `add` 得到 `8`，再传给 `multiply` 得到 `16`。

### 练习 2：理解分号对返回值的影响

要求：把 `add` 函数最后一行改成 `a + b;`，观察错误，并写出正确修复方式。

错误写法：

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b;
}
```

正确写法：

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

解释：`a + b` 是表达式，会产生值。`a + b;` 是语句，返回 `()`。函数声明要返回 `i32`，所以错误写法会类型不匹配。

### 练习 3：用块表达式限制临时变量作用域

要求：用块表达式计算 `(7 + 3) * 2`，并保证临时变量 `base` 只在块内部有效。

参考答案：

```rust
let result = {
    let base = 7 + 3;
    base * 2
};
println!("块表达式结果: {result}");
```

解释：`base` 只在 `{}` 内部存在。块最后一行 `base * 2` 没有分号，所以整个块返回 `20`。

### 练习 4：观察作用域错误并修复

要求：尝试在内部作用域外打印 `inner`，再用正确方式修复。

错误写法：

```rust
{
    let inner = 20;
}
println!("{inner}");
```

参考答案：

```rust
let inner = {
    let value = 20;
    value
};
println!("{inner}");
```

解释：第一段代码中，`inner` 离开花括号后失效。修复方式是让代码块返回值，再把结果绑定到外部变量 `inner`。

## 相关笔记

- [Rust学习笔记 01：变量和可变性](https://kylinxin.github.io/2026/05/06/Rust学习笔记-01-变量和可变性/)
- [Rust学习笔记 02：数据类型](https://kylinxin.github.io/2026/05/06/Rust学习笔记-02-数据类型/)
