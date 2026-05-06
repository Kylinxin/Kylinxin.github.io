---
title: "Rust学习笔记 16：异步编程 async-await"
date: 2026-04-16 09:00:00
updated: 2026-05-06 19:50:00
categories:
  - "Rust"
tags:
  - "Rust"
  - "Cargo"
  - "异步编程"
abbrlink: "rust-note-16-async-await"
---
对应代码文件：`src/bin/16_async_await.rs`

运行命令：

```bash
cargo run --bin lesson16_async_await
```

## 学习目标

异步编程用于在等待 IO、网络或定时器时不阻塞整个线程。Rust 使用 `Future`、`async` 和 `.await` 表达异步任务。

本节示例保持无外部依赖，重点解释机制。真实项目通常会使用 Tokio 或 async-std 这样的异步运行时。

- 理解 `async fn` 返回 Future。
- 知道 `.await` 表示等待异步结果。
- 理解 Future 需要运行时或执行器推动。
- 区分并发 concurrent 和并行 parallel。

## 核心概念速查

| 术语 | 基本意思 | 本节用途 |
| --- | --- | --- |
| async | 声明异步块或异步函数。 | `async fn load()` 不会立即执行完所有逻辑，而是返回 Future。 |
| await | 等待 Future 完成并取出结果。 | 只能在 async 上下文中使用。 |
| Future | 代表一个未来可能完成的计算。 | 需要被 poll 推动。 |
| 执行器 executor | 负责轮询 Future 的运行组件。 | Tokio 就提供成熟执行器。 |
| 运行时 runtime | 提供执行器、定时器、IO 驱动等能力。 | 网络异步通常离不开运行时。 |

## 完整源码

```rust
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll, Wake, Waker};

struct NoopWaker;

impl Wake for NoopWaker {
    fn wake(self: Arc<Self>) {
        // 这个演示用的 Future 会立即完成，所以不需要真正唤醒任务。
    }
}

fn block_on_ready<F: Future>(future: F) -> F::Output {
    // 真实项目通常使用 Tokio 或 async-std 这样的运行时。
    // 这里不用外部依赖，只演示 Future 如何被 poll。
    let waker = Waker::from(Arc::new(NoopWaker));
    let mut context = Context::from_waker(&waker);
    let mut future = Box::pin(future);

    match Future::poll(Pin::as_mut(&mut future), &mut context) {
        Poll::Ready(value) => value,
        Poll::Pending => panic!("这个简单演示只支持立即完成的 Future"),
    }
}

async fn fetch_number() -> i32 {
    // async fn 返回一个实现 Future 的值；函数体不会立刻执行到完成。
    42
}

async fn double_number() -> i32 {
    // await 会等待另一个 Future 完成，并取出结果。
    let number = fetch_number().await;
    number * 2
}

fn main() {
    let result = block_on_ready(double_number());
    println!("异步计算结果: {result}");

    println!("实际网络、文件、定时器异步任务通常需要 Tokio 或 async-std 运行时。");
}
```

## 运行与观察

使用 `cargo run --bin lesson16_async_await` 可以只运行本节示例。

这里的 `--bin` 后面写的是 `Cargo.toml` 中声明的目标名，不是 `.rs` 文件名。文件名用于组织源码，bin 名用于 Cargo 运行。

建议初学时先直接运行，再修改一两行代码观察编译器提示。Rust 的错误信息通常会指出所有权、类型或借用规则哪里不满足。

## 逐段解读

### async fn

异步函数调用后得到 Future，不是马上得到最终值。

### .await

在异步上下文中等待另一个 Future 完成。

### 无依赖示例

本节用标准库展示 Future 被手动推动的基本过程。

### 真实项目

实际网络、文件和定时器异步通常使用 Tokio 等运行时。

## 专有词语详解

### async

声明异步块或异步函数。

`async fn load()` 不会立即执行完所有逻辑，而是返回 Future。

### await

等待 Future 完成并取出结果。

只能在 async 上下文中使用。

### Future

代表一个未来可能完成的计算。

需要被 poll 推动。

### 执行器 executor

负责轮询 Future 的运行组件。

Tokio 就提供成熟执行器。

### 运行时 runtime

提供执行器、定时器、IO 驱动等能力。

网络异步通常离不开运行时。

## 初学者拓展

异步不是自动开新线程。它主要让等待中的任务让出执行权。

并发表示多个任务在时间上交错推进；并行表示多个任务真的在多个 CPU 核心同时运行。

`async fn` 的返回类型可理解为 `impl Future<Output = T>`。

没有 `.await` 或执行器推动，Future 可能只是一个尚未运行完成的状态机。

## 常见误区

- 不要以为调用 `async fn` 就会立即执行网络请求。它返回的是 Future。
- 不要在异步任务里随意执行长时间阻塞操作，否则会卡住运行时线程。
- 标准库没有内置完整异步运行时，所以真实应用通常需要外部 crate。
- 异步能提升等待型任务吞吐量，不一定让 CPU 密集计算更快。

## 进阶练习与参考答案

### 练习 1：理解 async 返回值

要求：写一个返回数字的 `async fn`，并说明调用结果是什么。

参考答案：

```rust
async fn answer() -> i32 {
    42
}

fn main() {
    let future = answer();
    drop(future);
}
```

解释：`answer()` 返回 Future。没有执行器或 `.await`，这里不会直接得到 `42`。

### 练习 2：组合 async 函数

要求：写两个 async 函数，在第三个 async 函数中 await 它们。

参考答案：

```rust
async fn left() -> i32 { 20 }
async fn right() -> i32 { 22 }

async fn sum() -> i32 {
    left().await + right().await
}
```

解释：`await` 只能写在 async 函数或 async 块里。

### 练习 3：区分并发和并行

要求：用文字说明异步适合什么任务。

参考答案：

```text
异步适合网络请求、文件 IO、数据库访问等等待型任务。它让一个线程在等待某个任务时继续推进其他任务。CPU 密集计算通常需要线程池或并行计算库。
```

解释：这道题没有固定代码答案，重点是理解异步的使用边界。

## 相关笔记

- [Rust学习笔记 15：常用标准库函数与实用宏](https://kylinxin.github.io/2026/04/15/Rust学习笔记-15-常用标准库函数与实用宏/)
