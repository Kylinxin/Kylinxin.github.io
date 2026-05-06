---
title: "Rust学习笔记 07：结构体和方法"
date: 2026-04-07 09:00:00
updated: 2026-04-07 09:00:00
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
本篇整理结构体、字段、关联函数、方法、可变方法、Debug 输出和结构体更新语法。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
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
## 逐段解读
### 结构体定义

`struct User` 把用户名、邮箱和状态组合成一个有名字的数据类型。

### Debug 派生

`#[derive(Debug)]` 让结构体可以用 `{:?}` 调试打印。

### 关联函数

`fn new(...) -> Self` 不接收 `self`，常用于构造实例。`Self` 表示当前结构体类型。

### 读取方法

`fn summary(&self) -> String` 借用实例，生成摘要，不取得所有权。

### 修改方法

`fn deactivate(&mut self)` 需要可变借用，可以修改字段。

### 结构体更新语法

`..user` 复用剩余字段。被移动的字段会让原结构体不能完整继续使用。
## 初学者拓展
结构体适合表达有固定字段的业务对象。字段名能提高代码可读性。

方法放在 `impl` 块里。第一个参数是 `self`、`&self` 或 `&mut self`。

构造函数不是语言内置概念，Rust 常用关联函数 `new` 表达构造意图。
## 常见误区
- 如果方法需要修改字段，实例变量和方法参数都要满足可变要求。
- 结构体更新语法可能移动字段，尤其是 `String` 这类非 Copy 类型。
- 没有 `Debug` 时不能直接用 `{:?}` 打印结构体。
## 进阶练习与参考答案
### 练习 1：增加激活方法

要求：为 `User` 增加 `activate(&mut self)`，把 `active` 改回 `true`。

参考答案：

```rust
impl User {
    fn activate(&mut self) {
        self.active = true;
    }
}
```

解释：`&mut self` 表示方法会修改当前实例。调用前实例变量也必须是 `mut`。

### 练习 2：新增邮箱域名方法

要求：写 `email_domain(&self) -> &str`，返回邮箱中 `@` 后面的域名。

参考答案：

```rust
impl User {
    fn email_domain(&self) -> &str {
        self.email.split('@').nth(1).unwrap_or("")
    }
}
```

解释：返回的是 `&str`，它引用 `self.email` 内部数据，不需要创建新字符串。
## 相关笔记
- [Rust学习笔记 06：引用与切片](https://kylinxin.github.io/2026/04/06/Rust学习笔记-06-引用与切片/)
- [Rust学习笔记 08：枚举与模式匹配](https://kylinxin.github.io/2026/04/08/Rust学习笔记-08-枚举与模式匹配/)
