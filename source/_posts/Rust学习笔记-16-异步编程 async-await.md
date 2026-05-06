---
title: "Rust学习笔记 16：异步编程 async-await"
date: 2026-04-16 09:00:00
updated: 2026-04-16 09:00:00
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
本篇整理 Rust async/await 的基本模型：Future、Waker、Context、Poll、Pin，以及为什么真实项目通常需要 Tokio 等运行时。
学完这一节后，你应该能读懂本节源码，并能独立完成文末练习。
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
## 逐段解读
### Future

`async fn` 返回实现 `Future` 的值。调用 async 函数不会立刻执行到完成。

### Waker

`NoopWaker` 是演示用唤醒器。真实运行时会用 waker 通知任务继续执行。

### Context

`Context::from_waker(&waker)` 把唤醒器传给 Future 的 poll 过程。

### Pin

`Box::pin(future)` 固定 Future 的内存位置，满足 poll 的安全要求。

### Poll

`Poll::Ready(value)` 表示完成，`Poll::Pending` 表示暂时不能完成。

### await

`fetch_number().await` 等待另一个 Future 完成，并取出结果。
## 初学者拓展
Rust 的 async 是惰性的。Future 需要被执行器不断 poll，才会向前推进。

标准库提供 Future 抽象，但不提供完整异步运行时。网络、定时器等任务通常使用 Tokio 或 async-std。

本示例只处理立即完成的 Future，用于理解模型，不适合作为通用执行器。
## 常见误区
- 不要以为调用 async 函数会立即得到结果。它返回的是 Future。
- 不要把示例中的 `block_on_ready` 当成生产运行时。它不能处理真正的 Pending 任务。
- 在 async 代码中持有阻塞操作会影响并发，应使用运行时提供的异步 API。
## 进阶练习与参考答案
### 练习 1：组合两个 async 函数

要求：新增 `async fn triple_number() -> i32`，等待 `fetch_number()` 后乘以 3。

参考答案：

```rust
async fn triple_number() -> i32 {
    let number = fetch_number().await;
    number * 3
}

let result = block_on_ready(triple_number());
println!("{result}");
```

解释：`await` 取出 Future 的结果后，可以继续普通计算。

### 练习 2：理解 Pending 限制

要求：说明为什么当前 `block_on_ready` 不能运行真正的网络请求 Future。

参考答案：

```rust
match Future::poll(Pin::as_mut(&mut future), &mut context) {
    Poll::Ready(value) => value,
    Poll::Pending => panic!("这个简单演示只支持立即完成的 Future"),
}
```

解释：真正的网络 Future 常会先返回 `Pending`。生产运行时会保存任务并在 waker 唤醒后继续 poll，本示例直接 panic。
## 相关笔记
- [Rust学习笔记 15：常用标准库函数与实用宏](https://kylinxin.github.io/2026/04/15/Rust学习笔记-15-常用标准库函数与实用宏/)
