---
title: "Rust学习笔记 01：变量和可变性"
date: 2026-04-01 09:00:00
updated: 2026-04-01 09:00:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "变量"
abbrlink: "rust-note-01-variables-mutability"
---
对应代码文件：`src/bin/01_variables_mutability.rs`
运行命令：
```bash
cargo run --bin lesson01_variables_mutability
```
## 学习目标
本篇整理 Rust 的变量规则：默认不可变、mut、shadowing 和 const。这些规则决定了一个值能不能被修改，也是后续学习所有权和借用的基础。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
## 完整源码
```rust
fn main() {
    // Rust 变量默认不可变。不可变能减少意外修改，让代码更容易推理。
    let language = "Rust";
    println!("正在学习: {language}");

    // 如果需要修改变量，必须显式写 mut。
    let mut score = 0;
    score += 10;
    println!("当前分数: {score}");

    // shadowing（遮蔽）会创建一个新的同名变量，不要求原变量是 mut。
    // 常用于把一个值转换成另一种形式。
    let spaces = "   ";
    let spaces = spaces.len();
    println!("空格数量: {spaces}");

    // const 是编译期常量，必须写类型，通常使用全大写命名。
    const MAX_POINTS: u32 = 100;
    println!("满分: {MAX_POINTS}");
}
```
## 逐段解读
### 不可变变量

`let language = "Rust";` 创建不可变变量。默认不可变能减少状态变化，读代码时只要没看到 `mut`，就能判断它不会被重新赋值。

### 格式化输出

`println!("正在学习: {language}");` 使用格式化输出。`println!` 是宏，`{language}` 会把变量值插入到字符串中。

### 可变变量

`let mut score = 0;` 创建可变变量。只有显式写 `mut`，Rust 才允许执行 `score += 10;` 这类修改操作。

### Shadowing

`let spaces = "   "; let spaces = spaces.len();` 创建新的同名变量。第一个是 `&str`，第二个是长度 `usize`，类型可以变化。

### 常量

`const MAX_POINTS: u32 = 100;` 定义编译期常量。常量必须写类型，通常使用全大写加下划线命名。
## 初学者拓展
`mut` 表示同一个变量的值会变。shadowing 表示重新创建一个同名变量。前者强调状态变化，后者强调计算转换。

如果值只是从一种形式转换到另一种形式，例如字符串转数字，shadowing 通常更自然。如果值会持续累计，例如分数，`mut` 更直接。

`const` 适合保存规则，例如最大分数、默认端口和及格线。它不能保存运行时才知道的结果。
## 常见误区
- 不要以为 `let` 声明的变量都能修改。Rust 默认不可变，修改变量必须写 `mut`。
- 不要把 shadowing 理解成偷偷修改变量。它是新的绑定，只是名字相同。
- 不要把 `const` 当普通变量。常量必须能在编译期确定，并且必须显式写类型。
## 进阶练习与参考答案
### 练习 1：区分不可变变量和可变变量

要求：新增变量 `level`，初始值为 `1`。先尝试不加 `mut` 修改它，再改成正确写法。

参考答案：

```rust
let mut level = 1;
level += 1;
println!("当前等级: {level}");
```

解释：如果写成 `let level = 1; level += 1;`，编译器会报错。加上 `mut` 后，Rust 才允许修改同一个变量。

### 练习 2：用 shadowing 完成类型转换

要求：定义字符串 `"42"`，再用 shadowing 把它转换成整数，并打印加 8 后的结果。

参考答案：

```rust
let number = "42";
let number: i32 = number.parse().expect("必须是数字");
println!("计算结果: {}", number + 8);
```

解释：第一个 `number` 是 `&str`，第二个 `number` 是 `i32`。shadowing 适合表达“同一个语义的值经过转换”。
## 相关笔记
- [Rust学习笔记 02：数据类型](https://kylinxin.github.io/2026/04/02/Rust学习笔记-02-数据类型/)
