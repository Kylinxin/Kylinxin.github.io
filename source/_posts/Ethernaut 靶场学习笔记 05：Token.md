---
title: "Ethernaut 靶场学习笔记 05：Token"
date: 2026-05-06 09:00:00
updated: 2026-05-06 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-05"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 5 - Token

## 本关目标

让玩家持有的 Token 数量超过初始 20。

## 考察知识点

- 无符号整数下溢
- Solidity 0.6 算术行为
- 余额检查顺序

## 题目源码

```javascript
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract Token {

  mapping(address => uint) balances;
  uint public totalSupply;

  constructor(uint _initialSupply) public {
    balances[msg.sender] = totalSupply = _initialSupply;
  }

  function transfer(address _to, uint _value) public returns (bool) {
    require(balances[msg.sender] - _value >= 0);
    balances[msg.sender] -= _value;
    balances[_to] += _value;
    return true;
  }

  function balanceOf(address _owner) public view returns (uint balance) {
    return balances[_owner];
  }
}
```

## 源码与漏洞解析

1. 漏洞在 `transfer` 的检查：`require(balances[msg.sender] - _value >= 0)`。
2. `balances[msg.sender]` 是 `uint`，在 Solidity 0.6 中无下溢检查。当余额 20 转出 21 时，`20 - 21` 不会报错，而是回绕成一个极大的无符号整数。
3. 无符号整数永远大于等于 0，所以 require 通过。随后 `balances[msg.sender] -= _value` 再次下溢，玩家余额变成极大值。
4. Solidity 0.8 默认会检查算术上下溢；旧版本必须用 SafeMath 或显式 `require(balance >= amount)`。

## 过程截图

![转出 21 个 token 后余额发生下溢回绕的记录。](/images/ethernaut/level05-token-underflow.png)

图注：转出 21 个 token 后余额发生下溢回绕的记录。

## 解题过程

1. 初始余额为 20。
2. `transfer` 里先检查 `balances[msg.sender] - value >= 0`，但无符号整数下溢后会变成极大值。
3. 转出 21 个代币即可让余额回绕。

## Console WP

```javascript
await contract.balanceOf(player)
await contract.transfer(instance, 21)
await contract.balanceOf(player)
```

## 最终 WP

1. 查看初始余额：`balanceOf(player)` 应为 20。
2. 调用 `transfer(instance, 21)`，转出比余额多 1 的数量。
3. 再次查看余额，看到余额回绕为极大值。
4. 提交实例。

## 复盘与拓展

- 易错点：无符号整数永远不小于 0，配合旧编译器的回绕行为会让检查失效。
- 防御建议：使用 Solidity 0.8+ 或 SafeMath；扣减前显式检查 `balance >= amount`。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/ryKHlS34p
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
