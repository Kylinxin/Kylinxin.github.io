---
title: "Rust学习笔记 03：函数与作用域"
date: 2026-04-03 09:00:00
updated: 2026-05-06 19:50:00
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

本节讲函数定义、参数、返回值、表达式和作用域。函数是组织 Rust 程序的基本单位。

Rust 的作用域规则非常重要。变量何时可见、何时释放资源，都由作用域决定。

- 掌握 `fn` 的基本写法。
- 知道函数参数必须写类型。
- 理解表达式和语句的区别。
- 理解块作用域如何影响变量生命周期。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 函数 function | 一段有名字、可重复调用的代码。 | `fn main()` 是程序入口。 |
| 参数 parameter | 函数定义处接收的输入。 | Rust 函数参数必须标注类型。 |
| 返回值 return value | 函数计算后交给调用方的结果。 | Rust 常用最后一个表达式作为返回值。 |
| 表达式 expression | 会产生值的代码。 | `x + 1` 和 `{ x + 1 }` 都是表达式。 |
| 语句 statement | 执行动作但不产生可直接返回的值。 | `let x = 5;` 是语句。 |

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

## 运行与观察

使用 `cargo run --bin lesson03_functions_scope` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### 定义函数

`fn greet(name: &str)` 接收字符串切片并打印问候。

### 返回值

`fn add(left: i32, right: i32) -> i32` 使用 `-> i32` 标注返回类型。

### 表达式返回

函数体最后一行没有分号时，它的值会作为返回值。

### 块作用域

内部大括号创建新作用域，内部变量离开作用域后不能再访问。

## 专有词语详解

### 函数 function

一段有名字、可重复调用的代码。

`fn main()` 是程序入口。

### 参数 parameter

函数定义处接收的输入。

Rust 函数参数必须标注类型。

### 返回值 return value

函数计算后交给调用方的结果。

Rust 常用最后一个表达式作为返回值。

### 表达式 expression

会产生值的代码。

`x + 1` 和 `{ x + 1 }` 都是表达式。

### 语句 statement

执行动作但不产生可直接返回的值。

`let x = 5;` 是语句。

## 初学者拓展

Rust 不要求函数定义在调用之前。只要在同一模块中，函数可以写在 `main` 前后。

参数类型不能省略，因为函数签名是调用方和实现方之间的明确契约。

最后一个表达式不写分号。加上分号会变成语句，返回值就会变成 `()`。

作用域不仅控制变量可见性，也控制资源释放时机。这会直接影响后续所有权规则。

## 常见误区

- 不要在返回表达式末尾误加分号。
- 不要以为内部作用域的变量可以在外部继续使用。
- 函数参数名和外部变量名相同也没关系，它们属于不同作用域。
- `return` 可以用，但 Rust 更常见的风格是最后表达式返回。

## 进阶练习与参考答案

### 练习 1：写一个乘法函数

要求：定义 `multiply(a: i32, b: i32) -> i32`。

参考答案：

```rust
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    println!("{}", multiply(6, 7));
}
```

解释：`a * b` 没有分号，因此是返回表达式。

### 练习 2：用块表达式计算值

要求：用一个代码块计算 `base + 10`，赋给变量。

参考答案：

```rust
fn main() {
    let base = 5;
    let result = {
        let extra = 10;
        base + extra
    };
    println!("{result}");
}
```

解释：代码块本身可以产生值，最后表达式作为块的值。

### 练习 3：解释作用域错误

要求：让内部变量在外部可用。

参考答案：

```rust
fn main() {
    let value = {
        let inner = 12;
        inner * 2
    };
    println!("{value}");
}
```

解释：不能直接在外部访问 `inner`，但可以把计算结果返回给外部变量。

## 相关笔记

- [Rust学习笔记 02：数据类型](https://kylinxin.github.io/2026/04/02/Rust学习笔记-02-数据类型/)
- [Rust学习笔记 04：流程控制](https://kylinxin.github.io/2026/04/04/Rust学习笔记-04-流程控制/)
