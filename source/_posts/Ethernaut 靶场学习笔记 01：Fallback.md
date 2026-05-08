---
title: "Ethernaut 靶场学习笔记 01：Fallback"
date: 2026-05-02 09:00:00
updated: 2026-05-02 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-01"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 1 - Fallback

## 本关目标

成为 Fallback 合约 owner，并调用 `withdraw()` 把实例余额清空。

## 考察知识点

- fallback/receive 入口
- 低金额 contribute 铺垫权限条件
- owner 接管后提款

## 题目源码

```javascript
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Fallback {

  mapping(address => uint) public contributions;
  address public owner;

  constructor() {
    owner = msg.sender;
    contributions[msg.sender] = 1000 * (1 ether);
  }

  modifier onlyOwner {
        require(
            msg.sender == owner,
            "caller is not the owner"
        );
        _;
    }

  function contribute() public payable {
    require(msg.value < 0.001 ether);
    contributions[msg.sender] += msg.value;
    if(contributions[msg.sender] > contributions[owner]) {
      owner = msg.sender;
    }
  }

  function getContribution() public view returns (uint) {
    return contributions[msg.sender];
  }

  function withdraw() public onlyOwner {
    payable(owner).transfer(address(this).balance);
  }

  receive() external payable {
    require(msg.value > 0 && contributions[msg.sender] > 0);
    owner = msg.sender;
  }
}
```

## 源码与漏洞解析

1. `withdraw()` 被 `onlyOwner` 保护，因此真正目标是改写 `owner`。
2. `contribute()` 看似可以改 owner，但初始 owner 的贡献额是 `1000 ether`，正常玩家不可能用小额贡献超过它。
3. 真正入口在 `receive()`：只要直接给合约转 ETH，且 `msg.value > 0`、`contributions[msg.sender] > 0`，合约就会把 `owner` 改成 `msg.sender`。
4. 所以攻击必须分两步：先 `contribute` 一笔小于 `0.001 ether` 的金额建立贡献记录，再发送一笔普通 ETH 转账触发 `receive()`。

## 过程截图

![接管 owner 后再执行 withdraw 的过程记录。](/images/ethernaut/level01-fallback-owner.png)

图注：接管 owner 后再执行 withdraw 的过程记录。

## 解题过程

1. 先调用 `contribute`，发送一笔很小的 ETH，让 `contributions[msg.sender] > 0`。
2. 再向实例地址直接转账，calldata 为空会进入 `receive()`。
3. `receive()` 检查通过后把 `owner` 改成调用者。
4. 调用 `withdraw()` 清空合约余额。

## Console WP

```javascript
await contract.contribute({ value: toWei("0.000001") })
await contract.sendTransaction({ value: toWei("0.000001") })
await contract.owner()
await contract.withdraw()
```

## 最终 WP

1. 先调用 `contribute({value: toWei("0.000001")})`，让自己的 contribution 大于 0。
2. 再用 `sendTransaction` 给实例地址转一笔小额 ETH，calldata 为空，所以进入 `receive()`。
3. 确认 `owner()` 已变成玩家地址。
4. 调用 `withdraw()` 提走余额，提交实例。

## 复盘与拓展

- 易错点：不要只审查显式函数；`receive`/`fallback` 也是外部入口。
- 防御建议：授权逻辑不要放在收款回调里；收款逻辑尽量保持无状态，关键权限只能通过明确的管理流程变更。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/rJy5LtoN6
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
