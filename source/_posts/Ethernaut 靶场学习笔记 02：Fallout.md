---
title: "Ethernaut 靶场学习笔记 02：Fallout"
date: 2026-05-03 09:00:00
updated: 2026-05-03 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-02"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 2 - Fallout

## 本关目标

利用构造函数拼写错误，获得 Fallout 合约 owner。

## 考察知识点

- 构造函数历史写法
- 函数名拼写错误
- public 初始化函数风险

## 题目源码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import 'openzeppelin-contracts-06/math/SafeMath.sol';

contract Fallout {
  
  using SafeMath for uint256;
  mapping (address => uint) allocations;
  address payable public owner;


  /* constructor */
  function Fal1out() public payable {
    owner = msg.sender;
    allocations[owner] = msg.value;
  }

  modifier onlyOwner {
        require(
            msg.sender == owner,
            "caller is not the owner"
        );
        _;
    }

  function allocate() public payable {
    allocations[msg.sender] = allocations[msg.sender].add(msg.value);
  }

  function sendAllocation(address payable allocator) public {
    require(allocations[allocator] > 0);
    allocator.transfer(allocations[allocator]);
  }

  function collectAllocations() public onlyOwner {
    msg.sender.transfer(address(this).balance);
  }

  function allocatorBalance(address allocator) public view returns (uint) {
    return allocations[allocator];
  }
}
```

## 源码与漏洞解析

1. Solidity 0.6 已经支持 `constructor` 关键字，但这份代码保留了旧式注释 `/* constructor */`，函数名却写成 `Fal1out`。
2. `Fallout` 中第二个字符应该是字母 `l`，源码里 `Fal1out` 使用了数字 `1`，因此它不是构造函数，而是一个普通的 `public payable` 函数。
3. 普通外部用户可以直接调用这个函数，函数内部把 `owner = msg.sender`，所以 owner 会被调用者接管。

## 过程截图

![调用误写初始化函数后 owner 变化的记录。](/images/ethernaut/level02-fallout-owner.png)

图注：调用误写初始化函数后 owner 变化的记录。

## 解题过程

1. 观察源码中 `Fal1out` 使用数字 1，而不是合约名里的字母 l。
2. 该函数是 public，任何地址都能调用。
3. 发送一笔很小金额调用 `Fal1out()`，触发 owner 赋值。

## Console WP

```javascript
await contract.owner()
await contract.Fal1out({ value: toWei("0.000001") })
await contract.owner()
```

## 最终 WP

1. 调用前先查看 `owner()`。
2. 调用 `Fal1out({value: toWei("0.000001")})`。
3. 再次查看 `owner()`，确认已经变成自己的地址。
4. 提交实例。

## 复盘与拓展

- 易错点：Solidity 0.4.22 之后推荐 `constructor` 关键字，就是为避免这类拼写事故。
- 防御建议：使用现代编译器；初始化函数必须加访问控制和一次性初始化保护。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/SkJgDcs4T
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
