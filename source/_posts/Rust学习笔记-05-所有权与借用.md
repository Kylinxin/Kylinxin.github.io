---
title: "Rust学习笔记 05：所有权与借用"
date: 2026-04-05 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "所有权"
abbrlink: "rust-note-05-ownership-borrowing"
---
对应代码文件：`src/bin/05_ownership_borrowing.rs`

运行命令：

```bash
cargo run --bin lesson05_ownership_borrowing
```

## 学习目标

本篇系统整理 Rust 最核心、也最容易让初学者卡住的机制：**所有权 ownership**、**移动 move**、**不可变借用 immutable borrowing**、**可变借用 mutable borrowing**、**Copy 类型**和**资源自动释放**。

学完这一节后，你应该能够：

- 判断一个值在赋值、传参、返回时是否发生所有权移动。
- 理解为什么 `String` 传给函数后原变量通常不能再使用。
- 使用 `&T` 让函数只读访问数据，而不取得所有权。
- 使用 `&mut T` 安全地修改数据，并理解“同一时间只能有一个可变借用”。
- 区分 `Copy`、`Clone`、move 三种行为。
- 初步知道函数参数什么时候写 `String`、`&String`、`&str`、`&mut String`。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| 所有权 ownership | 一个值在同一时间只能有一个所有者。 | 决定谁负责释放 `String` 等资源。 |
| 移动 move | 所有权从一个变量转移到另一个变量。 | `take_ownership(owned)` 后，`owned` 不能继续使用。 |
| 借用 borrowing | 通过引用临时使用值，不取得所有权。 | `borrow_text(&owned)` 只读取字符串。 |
| 可变借用 mutable borrowing | 通过 `&mut T` 临时修改值。 | `change_text(&mut mutable_text)` 修改原字符串。 |
| Copy | 简单值赋值时直接复制，不发生 move。 | `let y = x;` 后整数 `x` 仍然可用。 |
| Clone | 显式复制数据，可能产生堆内存拷贝。 | 需要保留两份 `String` 时使用 `clone()`。 |
| Drop | 值离开作用域时自动清理资源。 | 函数结束时拥有 `String` 的变量会释放内存。 |

## 完整源码

```rust
fn take_ownership(text: String) {
    // text 的所有权移动到函数里，函数结束后会释放。
    println!("接收所有权: {text}");
}

fn borrow_text(text: &String) {
    // &String 是不可变借用，不取得所有权。
    println!("借用文本: {text}");
}

fn change_text(text: &mut String) {
    // &mut String 是可变借用，同一时间只能有一个可变借用。
    text.push_str(" language");
}

fn main() {
    let owned = String::from("Rust");
    borrow_text(&owned);
    println!("借用后仍可使用: {owned}");

    take_ownership(owned);
    // 这里不能再使用 owned，因为所有权已经移动。

    let mut mutable_text = String::from("Rust");
    change_text(&mut mutable_text);
    println!("修改后: {mutable_text}");

    // Copy 类型（如整数）会复制值，不会发生所有权移动。
    let x = 5;
    let y = x;
    println!("x={x}, y={y}");
}
```

## 先建立一个核心直觉

Rust 的所有权规则主要解决一个问题：**谁负责释放内存和其他资源**。

在很多语言里，内存管理通常有两种路线：

- C/C++：程序员手动申请、手动释放，性能高，但容易出现重复释放、忘记释放、悬垂指针等问题。
- Java/Python/Go：运行时垃圾回收器自动管理内存，写起来轻松，但需要运行时检查和回收。

Rust 选择第三条路线：**编译器在编译阶段检查所有权和借用规则，程序运行时不需要垃圾回收器，也不需要手动 free**。

可以把 Rust 的规则理解成三句话：

1. 每个值在同一时间只有一个所有者。
2. 当所有者离开作用域，值会被自动释放。
3. 可以通过引用借用值，但借用必须遵守读写安全规则。

这三句话就是本节所有代码的基础。

## 专有词语详解

### 所有权 ownership

所有权表示“谁拥有这个值，谁负责在离开作用域时清理它”。Rust 不需要垃圾回收器，核心原因就是编译器能静态判断所有权。

### 移动 move

移动表示所有权转移。对 `String` 这类拥有堆资源的类型，赋值、传参、返回值都可能发生 move。

### 借用 borrowing

借用表示临时使用别人的值。不可变借用 `&T` 只能读取，不能修改，也不会让原变量失效。

### 可变借用 mutable borrowing

可变借用 `&mut T` 可以修改值，但必须排他。它存在时，不能同时存在其他读引用或写引用。

### Copy

`Copy` 类型赋值时会复制值，原变量仍然有效。整数、布尔值、字符等简单类型通常实现了 `Copy`。

### Clone

`Clone` 是显式复制。对 `String` 来说，`clone()` 通常会复制堆上的字符串内容，因此 Rust 要求你明确写出来。

### Drop

`Drop` 表示资源清理动作。拥有资源的变量离开作用域时，Rust 会自动调用清理逻辑。

## 栈和堆的直觉

理解 `String` 为什么会移动，需要先区分栈和堆。

### 栈上的简单值

像 `i32`、`bool`、`char` 这类大小固定、复制成本低的值通常放在栈上：

```rust
let x = 5;
let y = x;
```

这里 `x` 和 `y` 都是整数。整数很小，复制一份很便宜，所以 `y = x` 会直接复制值，之后 `x` 仍然可以继续使用。

### 堆上的动态值

`String` 是可增长字符串，它的真实字符内容存在堆上。变量本身通常保存三类信息：

- 指向堆内存的指针。
- 当前字符串长度。
- 当前分配容量。

例如：

```rust
let s1 = String::from("Rust");
let s2 = s1;
```

如果 Rust 简单复制 `s1` 的指针给 `s2`，就会出现两个变量都以为自己负责释放同一块堆内存的问题。为了避免重复释放，Rust 默认让 `String` 发生 **move**：所有权从 `s1` 移到 `s2`，`s1` 失效。

因此，对堆上资源来说，Rust 更关心“谁拥有这块资源”，而不是只看变量名。

## 逐段解读

### 1. `take_ownership`：函数取得所有权

```rust
fn take_ownership(text: String) {
    println!("接收所有权: {text}");
}
```

这个函数的参数类型是 `String`，不是引用。调用时如果传入一个 `String` 变量，所有权会移动到参数 `text` 中。

```rust
let owned = String::from("Rust");
take_ownership(owned);
```

调用发生后：

- `owned` 不再拥有字符串。
- 函数内部的 `text` 成为新的所有者。
- 函数结束时，`text` 离开作用域，字符串资源被释放。

所以下面这种写法无法通过编译：

```rust
let owned = String::from("Rust");
take_ownership(owned);
println!("{owned}"); // 错误：owned 的所有权已经移动
```

这不是 Rust “不让你打印变量”，而是编译器发现：这个变量已经不再拥有有效资源。

### 2. `borrow_text`：不可变借用只读访问

```rust
fn borrow_text(text: &String) {
    println!("借用文本: {text}");
}
```

`&String` 表示不可变引用，也叫不可变借用。函数可以读取 `String`，但不会取得所有权。

```rust
let owned = String::from("Rust");
borrow_text(&owned);
println!("借用后仍可使用: {owned}");
```

这里传入的是 `&owned`，意思是“把 `owned` 借给函数看一下”。函数结束后，`owned` 仍然是原来的所有者，所以可以继续使用。

不可变借用适合这些场景：

- 函数只需要读取数据。
- 不希望调用方失去所有权。
- 不希望复制或克隆大对象。

### 3. `change_text`：可变借用用于修改

```rust
fn change_text(text: &mut String) {
    text.push_str(" language");
}
```

`&mut String` 表示可变引用。函数不拥有这个 `String`，但可以在借用期间修改它。

调用时需要两层明确标记：

```rust
let mut mutable_text = String::from("Rust");
change_text(&mut mutable_text);
println!("修改后: {mutable_text}");
```

第一层：变量本身必须声明为 `mut`。

```rust
let mut mutable_text = String::from("Rust");
```

第二层：调用函数时必须传入 `&mut mutable_text`。

```rust
change_text(&mut mutable_text);
```

Rust 要求你在定义变量和发起借用时都明确表达“这里会修改数据”。这让代码的读写意图非常清楚。

### 4. 可变借用为什么必须排他

Rust 的核心规则是：

- 同一时间可以有多个不可变引用。
- 同一时间只能有一个可变引用。
- 可变引用存在时，不能同时存在其他引用。

这条规则用于避免数据竞争和读写不一致。

错误示例：

```rust
let mut text = String::from("Rust");
let r1 = &text;
let r2 = &mut text; // 错误：已有不可变借用时不能再可变借用
println!("{r1}");
```

正确写法是让不可变借用先结束，再创建可变借用：

```rust
let mut text = String::from("Rust");
let r1 = &text;
println!("{r1}");

let r2 = &mut text;
r2.push_str(" language");
println!("{r2}");
```

在现代 Rust 中，引用的生命周期通常会在“最后一次使用”后结束，而不一定非要等到大括号结束。这叫非词法生命周期，英文常见缩写是 NLL。

### 5. `Copy` 类型不会移动所有权

```rust
let x = 5;
let y = x;
println!("x={x}, y={y}");
```

整数实现了 `Copy`，所以赋值时会复制值。复制之后，`x` 和 `y` 都可用。

常见 `Copy` 类型包括：

- 整数类型：`i32`、`u64` 等。
- 浮点数：`f32`、`f64`。
- 布尔值：`bool`。
- 字符：`char`。
- 只包含 `Copy` 类型的元组，例如 `(i32, bool)`。

`String` 没有实现 `Copy`，因为它拥有堆内存。复制 `String` 通常意味着分配新内存并复制字符内容，成本不低，所以 Rust 不会悄悄做这件事。

如果你确实需要复制 `String` 的内容，要显式使用 `clone()`：

```rust
let s1 = String::from("Rust");
let s2 = s1.clone();
println!("s1={s1}, s2={s2}");
```

`clone()` 是一次明确的深拷贝。Rust 希望你意识到这里可能有额外成本。

## Move、Borrow、Clone 的区别

| 行为 | 示例 | 原变量还能用吗 | 是否复制堆数据 | 适用场景 |
| --- | --- | --- | --- | --- |
| move | `let b = a;` | 通常不能 | 不复制 | 转移资源所有权 |
| borrow | `let b = &a;` | 能 | 不复制 | 临时只读使用 |
| mutable borrow | `let b = &mut a;` | 借用结束后能 | 不复制 | 临时修改 |
| clone | `let b = a.clone();` | 能 | 通常复制 | 需要两份独立数据 |
| copy | `let b = a;` | 能 | 值很小，直接复制 | `i32`、`bool` 等简单值 |

初学阶段可以先记住一个实用判断：

- 只是读取：优先借用。
- 需要修改：用可变借用。
- 函数要长期保存或消费这个值：传所有权。
- 确实需要两份独立数据：显式 `clone()`。

## 函数参数怎么选

所有权规则最终会影响 API 设计。下面是常见选择。

### 接收 `String`

```rust
fn save_name(name: String) {
    println!("保存: {name}");
}
```

表示函数要取得字符串所有权。调用后原变量不能继续使用。适合函数要消费、保存、转移这个字符串的场景。

### 接收 `&String`

```rust
fn print_name(name: &String) {
    println!("{name}");
}
```

表示只借用一个 `String`。不过在真实项目中，如果函数只需要读取字符串内容，通常更推荐 `&str`。

### 接收 `&str`

```rust
fn print_text(text: &str) {
    println!("{text}");
}
```

`&str` 更通用，因为它既能接收字符串字面量，也能接收 `String` 的切片：

```rust
let owned = String::from("Rust");
print_text(&owned);
print_text("Rust");
```

这是 Rust 中很常见的参数设计习惯：**只读字符串优先写 `&str`**。

### 接收 `&mut String`

```rust
fn append_lang(text: &mut String) {
    text.push_str(" language");
}
```

表示函数要修改调用方传入的字符串，但不取得所有权。调用方保留这个 `String`，借用结束后可以继续使用。

## 常见编译错误与修正

### 错误 1：使用已经 move 的值

```rust
let s = String::from("Rust");
take_ownership(s);
println!("{s}"); // 错误
```

修正方式一：如果函数只读，改成借用。

```rust
borrow_text(&s);
println!("{s}");
```

修正方式二：如果确实需要函数取得所有权，同时自己还要一份，显式克隆。

```rust
let s = String::from("Rust");
take_ownership(s.clone());
println!("{s}");
```

### 错误 2：可变借用和不可变借用重叠

```rust
let mut s = String::from("Rust");
let read = &s;
let write = &mut s; // 错误
println!("{read}");
```

修正方式：先完成读取，再开始修改。

```rust
let mut s = String::from("Rust");
let read = &s;
println!("{read}");

let write = &mut s;
write.push_str(" language");
```

### 错误 3：变量没有声明为 `mut`

```rust
let s = String::from("Rust");
change_text(&mut s); // 错误：s 不是可变变量
```

修正方式：

```rust
let mut s = String::from("Rust");
change_text(&mut s);
```

## 本节源码运行过程

运行：

```bash
cargo run --bin lesson05_ownership_borrowing
```

程序大致输出：

```text
借用文本: Rust
借用后仍可使用: Rust
接收所有权: Rust
修改后: Rust language
x=5, y=5
```

输出顺序说明：

1. `borrow_text(&owned)` 只是借用，所以 `owned` 还能继续打印。
2. `take_ownership(owned)` 取得所有权，之后源码里没有再使用 `owned`。
3. `change_text(&mut mutable_text)` 修改原字符串。
4. `x` 是 `Copy` 类型，赋值给 `y` 后仍然能打印 `x`。

## 小结

所有权和借用不是 Rust 的“附加规则”，而是 Rust 的基本编程模型。你写函数、传参数、设计结构体字段、遍历集合、处理错误时都会遇到它。

这一节最重要的判断方式是：

- 这个值由谁拥有？
- 这次传参是在移动所有权，还是只是在借用？
- 如果要修改，是否需要 `mut` 和 `&mut`？
- 当前是否存在重叠的读写借用？
- 如果想保留两份数据，是不是应该显式 `clone()`？

只要每次都按这几个问题检查，所有权系统就会从“难点”变成“帮你检查代码的工具”。

## 进阶练习与参考答案

### 练习 1：避免所有权移动

要求：写一个函数打印字符串长度，但调用后原 `String` 仍可继续使用。

参考答案：

```rust
fn print_len(text: &String) {
    println!("长度: {}", text.len());
}

fn main() {
    let name = String::from("Rust");
    print_len(&name);
    println!("仍可使用: {name}");
}
```

解释：函数参数使用引用 `&String`，只借用值，不移动所有权。

进一步改进：真实项目中更推荐用 `&str`。

```rust
fn print_len(text: &str) {
    println!("长度: {}", text.len());
}

fn main() {
    let name = String::from("Rust");
    print_len(&name);
    print_len("borrow");
    println!("仍可使用: {name}");
}
```

### 练习 2：限制可变借用作用域

要求：先用可变借用修改字符串，再在外部打印原字符串。

参考答案：

```rust
fn main() {
    let mut text = String::from("Rust");
    {
        let borrowed = &mut text;
        borrowed.push_str(" book");
    }
    println!("{text}");
}
```

解释：把可变借用放进小作用域，离开作用域后就可以再次使用原变量。

### 练习 3：修复 move 后继续使用的问题

要求：下面代码不能通过编译，请写出两种修复方式。

```rust
fn consume(text: String) {
    println!("{text}");
}

fn main() {
    let title = String::from("Rust ownership");
    consume(title);
    println!("{title}");
}
```

参考答案一：函数改为借用。

```rust
fn consume(text: &str) {
    println!("{text}");
}

fn main() {
    let title = String::from("Rust ownership");
    consume(&title);
    println!("{title}");
}
```

参考答案二：调用时显式克隆。

```rust
fn consume(text: String) {
    println!("{text}");
}

fn main() {
    let title = String::from("Rust ownership");
    consume(title.clone());
    println!("{title}");
}
```

解释：第一种方式避免移动所有权，通常更推荐。第二种方式保留函数签名，但会复制一份字符串内容。

### 练习 4：返回所有权

要求：写一个函数接收 `String`，在末尾追加内容后把所有权还给调用方。

参考答案：

```rust
fn add_suffix(mut text: String) -> String {
    text.push_str(" language");
    text
}

fn main() {
    let text = String::from("Rust");
    let text = add_suffix(text);
    println!("{text}");
}
```

解释：`text` 被移动进函数，函数内部拥有它。返回 `text` 时，所有权又移动回调用方的新变量。

### 练习 5：使用可变借用修改而不转移所有权

要求：写一个函数 `append_suffix(text: &mut String, suffix: &str)`，把 `suffix` 追加到 `text` 后面。

参考答案：

```rust
fn append_suffix(text: &mut String, suffix: &str) {
    text.push_str(suffix);
}

fn main() {
    let mut title = String::from("Rust");
    append_suffix(&mut title, " ownership");
    append_suffix(&mut title, " and borrowing");
    println!("{title}");
}
```

解释：`text` 是可变借用，函数可以修改原字符串；`suffix` 是 `&str`，可以接收字符串字面量，也可以接收 `String` 的引用。

### 练习 6：判断 move、copy、clone

要求：判断下面每行之后，原变量是否还能使用，并说明原因。

```rust
let number = 10;
let copied = number;

let name = String::from("Rust");
let moved = name;

let city = String::from("Macau");
let cloned = city.clone();
```

参考答案：

```rust
fn main() {
    let number = 10;
    let copied = number;
    println!("number={number}, copied={copied}");

    let name = String::from("Rust");
    let moved = name;
    println!("moved={moved}");
    // println!("{name}"); // 错误：name 已经 move 到 moved

    let city = String::from("Macau");
    let cloned = city.clone();
    println!("city={city}, cloned={cloned}");
}
```

解释：

- `number` 是整数，实现 `Copy`，赋值后还能继续使用。
- `name` 是 `String`，赋值给 `moved` 后发生所有权移动，`name` 不能继续使用。
- `city.clone()` 显式复制堆数据，`city` 和 `cloned` 都能继续使用。

### 练习 7：修复重叠借用

要求：下面代码不能通过编译，请修改为可以先打印长度，再追加内容。

```rust
fn main() {
    let mut text = String::from("Rust");
    let len_ref = &text;
    let write_ref = &mut text;
    write_ref.push_str(" language");
    println!("长度参考: {}", len_ref.len());
}
```

参考答案：

```rust
fn main() {
    let mut text = String::from("Rust");
    let len_ref = &text;
    println!("长度参考: {}", len_ref.len());

    let write_ref = &mut text;
    write_ref.push_str(" language");
    println!("{write_ref}");
}
```

解释：先完成不可变借用 `len_ref` 的最后一次使用，再创建可变借用 `write_ref`。这样读写借用不会重叠。

## 相关笔记

- [Rust学习笔记 04：流程控制](https://kylinxin.github.io/2026/04/04/Rust学习笔记-04-流程控制/)
- [Rust学习笔记 06：引用与切片](https://kylinxin.github.io/2026/04/06/Rust学习笔记-06-引用与切片/)
