---
title: "Ethernaut 靶场学习笔记 00：Hello Ethernaut"
date: 2026-05-01 09:00:00
updated: 2026-05-01 09:00:00
categories:
  - "区块链安全"
  - "Ethernaut"
tags:
  - "Ethernaut"
  - "Solidity"
  - "智能合约安全"
abbrlink: "ethernaut-level-00"
---
> 这是我的 Ethernaut 靶场个人学习笔记，用来记录每一关的题目目标、漏洞原理、利用过程和复盘要点，方便后续按关卡重新练习和查漏补缺。

- 关卡：Level 0 - Hello Ethernaut

## 本关目标

熟悉 Ethernaut 的基本操作：连接钱包、创建实例、在浏览器控制台调用合约、提交实例。

## 考察知识点

- Ethernaut 实例生命周期
- 浏览器控制台与异步合约调用
- 公开变量 getter

## 题目源码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Instance {

  string public password;
  uint8 public infoNum = 42;
  string public theMethodName = 'The method name is method7123949.';
  bool private cleared = false;

  // constructor
  constructor(string memory _password) {
    password = _password;
  }

  function info() public pure returns (string memory) {
    return 'You will find what you need in info1().';
  }

  function info1() public pure returns (string memory) {
    return 'Try info2(), but with "hello" as a parameter.';
  }

  function info2(string memory param) public pure returns (string memory) {
    if(keccak256(abi.encodePacked(param)) == keccak256(abi.encodePacked('hello'))) {
      return 'The property infoNum holds the number of the next info method to call.';
    }
    return 'Wrong parameter.';
  }

  function info42() public pure returns (string memory) {
    return 'theMethodName is the name of the next method.';
  }

  function method7123949() public pure returns (string memory) {
    return 'If you know the password, submit it to authenticate().';
  }

  function authenticate(string memory passkey) public {
    if(keccak256(abi.encodePacked(passkey)) == keccak256(abi.encodePacked(password))) {
      cleared = true;
    }
  }

  function getCleared() public view returns (bool) {
    return cleared;
  }
}
```

## 源码与漏洞解析

1. 本关没有复杂漏洞，重点是建立操作习惯。Ethernaut 页面创建实例后，会在控制台暴露 `contract`、`player`、`instance` 等变量，`contract` 就是当前实例的 ABI 封装对象。
2. 源码中 `password` 是 `public`，Solidity 会自动生成 `password()` getter，所以控制台可以直接读到口令。`cleared` 虽然是 `private`，但这里只需要通过 `authenticate` 改它。
3. `info2` 用 `keccak256(abi.encodePacked(param))` 比较字符串，所以参数必须是精确的 `hello`。后续 `infoNum`、`theMethodName` 都是在训练如何根据返回值继续找下一个函数。

## 解题过程

1. 连接钱包并选择测试网，创建本关实例。
2. 在浏览器 DevTools Console 中逐个调用 `info` 系列函数。
3. 读取公开变量 `password`，把得到的口令传入 `authenticate`。
4. 回到页面提交实例。

## Console WP

```javascript
await contract.info()
await contract.info1()
await contract.info2("hello")
const n = await contract.infoNum()
await contract["info" + n]()
await contract.theMethodName()
await contract.method7123949()
const pass = await contract.password()
await contract.authenticate(pass)
```

## 最终 WP

1. 创建实例后打开浏览器 DevTools Console。
2. 按提示链式调用 `info -> info1 -> info2("hello") -> infoNum -> info42 -> theMethodName -> method7123949`。
3. 读取 `password()` 得到口令，调用 `authenticate(password)`。
4. 回到页面提交实例。

## 复盘与拓展

- 易错点：这是环境教学关，重点不是漏洞，而是理解 Ethernaut 的 `contract` 变量就是当前实例的 Web3 合约对象。
- 防御建议：生产合约不要把敏感口令放在链上公开变量里；即使变量标成 `private`，链上存储也能被读取。

## 参考资料

- 相关资料：https://hackmd.io/@0xbc000/ryToeKj4a
- Ethernaut 官方仓库：https://github.com/OpenZeppelin/ethernaut
- Solidity 文档：https://docs.soliditylang.org/
