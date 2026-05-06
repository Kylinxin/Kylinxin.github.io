---
title: "Rust学习笔记 03：函数与作用域"
date: 2026-04-03 09:00:00
updated: 2026-04-03 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "函数"
abbrlink: "rust-note-03-functions-scope"
---
对应代码文件：`src/bin/03_functions_scope.rs`
运行命令：
```bash
cargo run --bin lesson03_functions_scope
```
## 学习目标
本篇整理 Rust 函数定义、参数类型、返回值、表达式、语句和作用域。作用域规则也是所有权系统的前置基础。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
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
### 函数签名

`fn add(a: i32, b: i32) -> i32` 定义函数。参数类型必须显式声明，`-> i32` 表示返回值类型。

### 表达式返回值

`a + b` 没有分号，所以它是返回表达式。Rust 会把它作为函数返回值。

### 无返回值函数

`fn print_title(title: &str)` 没有写返回值类型，表示返回 `()`，即没有有意义的返回值。

### 程序入口

`main` 是程序入口。运行二进制程序时，Rust 从 `main` 开始执行。

### 作用域

内部花括号创建新作用域。内部可以访问外部变量，但外部不能访问内部变量。

### 块表达式

`let doubled = { let value = 7; value * 2 };` 展示块表达式。最后一行无分号，所以块返回 `14`。
## 初学者拓展
Rust 区分表达式和语句。表达式产生值，语句执行动作。

给表达式加上分号，通常会让它变成语句。函数返回值错误往往和多写分号有关。

变量离开作用域时，Rust 会自动清理它拥有的资源。后续所有权规则依赖这个行为。
## 常见误区
- 不要在返回表达式后随手加分号。如果函数声明返回 `i32`，最后写成 `a + b;` 会报错。
- 不要以为内部作用域变量在外面还能用。变量有效范围由花括号决定。
- 不要忽略 `&str` 中的 `&`。它表示引用，后续学习借用时会非常重要。
## 进阶练习与参考答案
### 练习 1：新增乘法函数并复用返回值

要求：新增 `multiply(a: i32, b: i32) -> i32`，在 `main` 中计算 `(3 + 5) * 2`。

参考答案：

```rust
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

let sum = add(3, 5);
let result = multiply(sum, 2);
println!("最终结果: {result}");
```

解释：函数返回值可以继续作为另一个函数的参数。这里先用 `add` 得到 `8`，再传给 `multiply` 得到 `16`。

### 练习 2：用块表达式限制临时变量作用域

要求：用块表达式计算 `(7 + 3) * 2`，并保证临时变量 `base` 只在块内部有效。

参考答案：

```rust
let result = {
    let base = 7 + 3;
    base * 2
};
println!("块表达式结果: {result}");
```

解释：`base` 只在 `{}` 内部存在。块最后一行没有分号，所以整个块返回 `20`。
## 相关笔记
- [Rust学习笔记 02：数据类型](https://kylinxin.github.io/2026/04/02/Rust学习笔记-02-数据类型/)
- [Rust学习笔记 04：流程控制](https://kylinxin.github.io/2026/04/04/Rust学习笔记-04-流程控制/)
