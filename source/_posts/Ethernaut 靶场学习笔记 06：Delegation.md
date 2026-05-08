---
title: "Ethernaut 靶场学习笔记 06：Delegation"
date: 2026-05-07 09:00:00
updated: 2026-05-07 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-06"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 6 - Delegation

## 本关目标

通过 Delegation 的 fallback + delegatecall 执行 Delegate.pwn，接管 owner。

## 考察知识点

- delegatecall
- 函数选择器
- 存储上下文复用

## 题目源码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Delegate {

  address public owner;

  constructor(address _owner) {
    owner = _owner;
  }

  function pwn() public {
    owner = msg.sender;
  }
}

contract Delegation {

  address public owner;
  Delegate delegate;

  constructor(address _delegateAddress) {
    delegate = Delegate(_delegateAddress);
    owner = msg.sender;
  }

  fallback() external {
    (bool result,) = address(delegate).delegatecall(msg.data);
    if (result) {
      this;
    }
  }
}
```

## 源码与漏洞解析

1. `Delegation` 自己没有 `pwn()`，但 fallback 会把任意 calldata 通过 `delegatecall` 交给 `Delegate`。
2. `delegatecall` 的关键点：执行的是被调用合约代码，但读写的是调用方的 storage，`msg.sender` 也保持为原始调用者。
3. `Delegate.pwn()` 写 `owner = msg.sender`。通过 delegatecall 执行时，写入的是 `Delegation.owner`。
4. 要触发它，只需要把 `pwn()` 的函数选择器作为 calldata 发给 Delegation 实例。选择器是 `bytes4(keccak256("pwn()")) = 0xdd365b8b`。

## 解题过程

1. 目标 fallback 把 calldata 委托给 Delegate 合约。
2. `pwn()` 的函数选择器为 `0xdd365b8b`。
3. 直接向实例发送这 4 字节 calldata，fallback 会 delegatecall 到 `pwn()`。
4. Delegate 代码写入 slot0，实际改的是 Delegation 的 slot0。

## Console WP

```javascript
await web3.eth.abi.encodeFunctionSignature("pwn()")
await contract.sendTransaction({ data: "0xdd365b8b" })
await contract.owner()
```

## 最终 WP

1. 计算或记下 `pwn()` selector：`0xdd365b8b`。
2. 向实例发送一笔 calldata 为 `0xdd365b8b` 的交易。
3. fallback delegatecall 到 Delegate，实际覆盖 Delegation 的 slot0 owner。
4. 确认 `owner()` 变成玩家地址并提交。

## 复盘与拓展

- 易错点：delegatecall 的危险点在于代码来自别处，但状态是自己的。
- 防御建议：只 delegatecall 到可信、固定、存储布局兼容的实现；升级代理要严格控制实现地址。
- 拓展：代理模式、库合约和 upgradeable 合约都大量依赖 delegatecall，审计时必须检查目标地址可控性与 storage layout。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/SJSC5T6Vp
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
