---
title: "Rust学习笔记 04：流程控制"
date: 2026-04-04 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "流程控制"
abbrlink: "rust-note-04-control-flow"
---
对应代码文件：`src/bin/04_control_flow.rs`

运行命令：

```bash
cargo run --bin lesson04_control_flow
```

## 学习目标

本节讲 Rust 的条件分支和循环。流程控制决定程序在不同条件下执行哪段代码。

`if` 在 Rust 中是表达式，可以返回值。循环也可以通过 `break value` 把值交给外部变量。

- 掌握 `if`、`else if`、`else`。
- 理解 `if` 表达式两边必须返回同一类型。
- 掌握 `loop`、`while`、`for` 的区别。
- 会用 `break`、`continue` 控制循环。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 分支 branch | 根据条件选择不同代码路径。 | `if score >= 60` 就是一个分支判断。 |
| 条件 condition | 结果必须是 `bool` 的表达式。 | Rust 不会把整数自动当成真假值。 |
| 无限循环 loop | 默认一直执行，直到 `break`。 | 适合重试、事件循环或需要手动退出的逻辑。 |
| while | 条件为真时重复执行。 | 适合循环次数不确定但退出条件明确的场景。 |
| for | 遍历迭代器或集合。 | Rust 中遍历数组、范围、集合时最常用。 |

## 完整源码

```rust
fn main() {
    let number = 7;

    // if 是表达式，每个分支返回的类型必须一致。
    let size = if number < 5 { "small" } else { "large" };
    println!("{number} is {size}");

    // loop 会无限循环，通常配合 break。
    let mut counter = 0;
    let loop_result = loop {
        counter += 1;
        if counter == 3 {
            break counter * 10;
        }
    };
    println!("loop 返回值: {loop_result}");

    // while 适合条件循环。
    let mut countdown = 3;
    while countdown > 0 {
        println!("{countdown}");
        countdown -= 1;
    }

    // for 适合遍历迭代器或范围。
    for item in ["所有权", "借用", "生命周期"] {
        println!("学习主题: {item}");
    }

    for n in 1..=3 {
        println!("闭区间数字: {n}");
    }
}
```

## 运行与观察

使用 `cargo run --bin lesson04_control_flow` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### if 判断

示例根据分数判断等级，条件必须产生 `bool`。

### if 表达式

`let status = if passed { "通过" } else { "未通过" };` 把分支结果赋值给变量。

### loop 返回值

`break counter * 2` 让循环结束并返回一个值。

### for 遍历

`for item in [...]` 逐个处理数组元素，写法简洁。

## 专有词语详解

### 分支 branch

根据条件选择不同代码路径。

`if score >= 60` 就是一个分支判断。

### 条件 condition

结果必须是 `bool` 的表达式。

Rust 不会把整数自动当成真假值。

### 无限循环 loop

默认一直执行，直到 `break`。

适合重试、事件循环或需要手动退出的逻辑。

### while

条件为真时重复执行。

适合循环次数不确定但退出条件明确的场景。

### for

遍历迭代器或集合。

Rust 中遍历数组、范围、集合时最常用。

## 初学者拓展

`if` 每个分支的返回类型必须一致。不能一个分支返回字符串，另一个分支返回数字。

`loop` 是 Rust 明确表达无限循环的方式。它比 `while true` 更有语义。

`for number in 1..=5` 包含 5，`1..5` 不包含 5。

`continue` 会跳过本轮剩余代码，进入下一轮循环。`break` 会直接结束循环。

## 常见误区

- 不要写 `if number {}`。Rust 条件必须是布尔值。
- 不要忘记 `if` 表达式两个分支类型一致。
- 遍历集合时要注意所有权。后续集合章节会进一步说明 `for x in vec` 和 `for x in &vec` 的区别。
- 无限循环必须确保有退出路径，否则程序会一直运行。

## 进阶练习与参考答案

### 练习 1：FizzBuzz

要求：打印 1 到 15，3 的倍数输出 Fizz，5 的倍数输出 Buzz，同时满足输出 FizzBuzz。

参考答案：

```rust
fn main() {
    for n in 1..=15 {
        if n % 15 == 0 {
            println!("FizzBuzz");
        } else if n % 3 == 0 {
            println!("Fizz");
        } else if n % 5 == 0 {
            println!("Buzz");
        } else {
            println!("{n}");
        }
    }
}
```

解释：先判断最严格的 `n % 15 == 0`，避免被 3 或 5 的分支提前截走。

### 练习 2：loop 返回值

要求：用 `loop` 找到第一个大于 100 且能被 7 整除的数字。

参考答案：

```rust
fn main() {
    let mut n = 101;
    let answer = loop {
        if n % 7 == 0 {
            break n;
        }
        n += 1;
    };
    println!("{answer}");
}
```

解释：`break n` 把循环结果返回给 `answer`。

### 练习 3：跳过偶数

要求：遍历 1 到 10，只打印奇数。

参考答案：

```rust
fn main() {
    for n in 1..=10 {
        if n % 2 == 0 {
            continue;
        }
        println!("{n}");
    }
}
```

解释：`continue` 跳过偶数那一轮的打印。

## 相关笔记

- [Rust学习笔记 03：函数与作用域](https://kylinxin.github.io/2026/04/03/Rust学习笔记-03-函数与作用域/)
- [Rust学习笔记 05：所有权与借用](https://kylinxin.github.io/2026/04/05/Rust学习笔记-05-所有权与借用/)
