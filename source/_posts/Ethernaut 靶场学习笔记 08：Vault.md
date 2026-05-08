---
title: "Ethernaut 靶场学习笔记 08：Vault"
date: 2026-05-09 09:00:00
updated: 2026-05-09 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-08"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 8 - Vault

## 本关目标

读取 Vault 的私有 password，调用 `unlock` 解锁。

## 考察知识点

- 链上 storage 可读
- `private` 不是加密
- slot 编号

## 题目源码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Vault {
  bool public locked;
  bytes32 private password;

  constructor(bytes32 _password) {
    locked = true;
    password = _password;
  }

  function unlock(bytes32 _password) public {
    if (password == _password) {
      locked = false;
    }
  }
}
```

## 源码与漏洞解析

1. `private` 只限制 Solidity 语法层面的访问，链上 storage 对所有节点公开。
2. Vault 有两个状态变量：`locked` 在 slot0，`password` 是 `bytes32`，通常在 slot1。
3. 用 `web3.eth.getStorageAt(instance, 1)` 可以直接读取 slot1 中的 32 字节密码。
4. 读取结果本身就是 `bytes32`，可以原样传给 `unlock`。

## 过程截图

![从 storage slot 中读取 password 的记录。](/images/ethernaut/level08-vault-storage.png)

图注：从 storage slot 中读取 password 的记录。

## 解题过程

1. `locked` 在 slot0，`password` 在 slot1。
2. 使用 `web3.eth.getStorageAt(instance, 1)` 读取 slot1。
3. 把读到的 `bytes32` 传给 `unlock`。

## Console WP

```javascript
const password = await web3.eth.getStorageAt(instance, 1)
await contract.unlock(password)
await contract.locked()
```

## 最终 WP

1. 调用 `web3.eth.getStorageAt(instance, 1)` 读取 password。
2. 把读出的 bytes32 传给 `contract.unlock(password)`。
3. 确认 `locked()` 为 false。
4. 提交实例。

## 复盘与拓展

- 易错点：链上数据对所有节点公开，`private` 不等于加密。
- 防御建议：不要把秘密明文上链；需要秘密时使用承诺、零知识、链下签名或延迟揭示机制。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/BkitIP3UT
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
