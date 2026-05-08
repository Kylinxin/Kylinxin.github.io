---
title: "Ethernaut 靶场学习笔记 07：Force"
date: 2026-05-08 09:00:00
updated: 2026-05-08 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-07"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 7 - Force

## 本关目标

让 Force 合约余额大于 0。

## 考察知识点

- 强制转 ETH
- selfdestruct 余额转移
- 不要依赖合约余额为 0

## 题目源码

```javascript
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Force {/*

                   MEOW ?
         /\_/\   /
    ____/ o o \
  /~____  =ø= /
 (______)__m_m)

*/}
```

## 源码与漏洞解析

1. Force 合约没有任何 payable 函数，正常转账会失败，但 EVM 仍有强制改变地址余额的路径。
2. 旧语义下 `selfdestruct(payable(target))` 会销毁当前合约并把余额发送到目标地址；目标合约无需实现 receive/fallback，也无法拒收。
3. 因此部署一个带余额的攻击合约，再让它 selfdestruct 到 Force 地址即可。
4. 这关的安全启发是：不要把业务判断建立在 `address(this).balance == 0` 这类外部可强制改变的状态上。

## 解题过程

1. 部署攻击合约并在部署或调用时给它一点 ETH。
2. 调用攻击合约中的 `selfdestruct(payable(instance))`。
3. 目标合约余额被强制增加。

## 攻击合约 WP

```javascript
contract ForceAttack {
    constructor() payable {}

    function attack(address payable instance) external {
        selfdestruct(instance);
    }
}
```

## 最终 WP

1. 部署攻击合约，并在部署或调用时给它一点 ETH。
2. 调用攻击合约的 `attack(instance)`。
3. 攻击合约执行 `selfdestruct(payable(instance))`，Force 余额增加。
4. 提交实例。

## 复盘与拓展

- 易错点：合约余额不是只能通过自身代码路径变化。
- 防御建议：不要把 `address(this).balance == 0` 当作安全不变量；使用内部记账变量表示业务余额。
- 拓展：Dencun 后 `selfdestruct` 的删除代码语义发生变化，但强制转余额这个学习点仍然需要单独理解。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/HyJQ0zJS6
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
