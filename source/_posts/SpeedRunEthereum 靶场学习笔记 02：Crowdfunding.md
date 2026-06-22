---
title: "SpeedRunEthereum 靶场学习笔记 02：Crowdfunding"
date: 2026-06-22 09:00:00
updated: 2026-06-22 09:00:00
categories:
  - "区块链开发"
  - "SpeedRunEthereum"
tags:
  - "SpeedRunEthereum"
  - "Solidity"
  - "Foundry"
  - "Scaffold-ETH 2"
  - "Crowdfunding"
  - "合约安全"
abbrlink: "speedrunethereum-crowdfunding"
---
> 这是我的 SpeedRunEthereum 靶场个人学习笔记。第二关 Crowdfunding 聚焦去中心化众筹合约：贡献记账、退款、截止时间、状态机推进、CEI 防重入、Sepolia 部署、Etherscan 验证和前端上线。

- 关卡：Crowdfunding
- 完成日期：2026/06/22
- 状态：✅ ACCEPTED（+10 XP）
- Ethereum 101 进度：2/4
- 框架：Foundry

## 本关目标

这一关实现一个去中心化众筹 dApp。用户可以在截止时间前向合约贡献 ETH；截止时间后，如果合约余额达到 `1 ether`，资金转给收款合约；如果没有达到门槛，贡献者可以按自己的贡献额退款。

项目中有两个核心合约：

| 合约 | 角色 | 说明 |
| --- | --- | --- |
| `CrowdFund` | 业务合约 | 本关需要手写的众筹逻辑 |
| `FundingRecipient` | 收款合约 | 出题人提供的收钱罐，不应修改 |

这类模型对应的真实场景包括 Gitcoin Grants、Juicebox、ConstitutionDAO 这类链上筹资或公共物品资助系统。

## 挑战完成记录

| 类别 | 内容 |
| --- | --- |
| CrowdFund | `0x9cc1a9b69c55af0b8aAF6AfDc33b30464c7C2Bd2` |
| FundingRecipient | `0x3b56885389111d7C56aA449d6c807D4F426235e3` |
| Deployer | `0x6d1cD1d9F7226De5af18a7f9fD64E3aA6e81ca04` |
| Vercel 前端 | https://crowdfunding-ky.vercel.app |
| Sepolia Etherscan | https://sepolia.etherscan.io/address/0x9cc1a9b69c55af0b8aAF6AfDc33b30464c7C2Bd2 |
| 部署交易 | `0xcbc2cbb16fbfe31869361c8ab6e5bcb67292707d6e253e56c9079156dc5275d2` |
| 部署费用 | `0.000436 ETH` |
| 区块 | `11115985` |
| 网络 | Sepolia（chain id `11155111`） |

## 专题一：众筹合约的状态机

这个合约的核心不是单个函数，而是一条状态机：

```text
接受贡献
  contribute() / receive()
      ↓
等待 deadline 到达
      ↓
execute()
      ↓
余额 >= 1 ETH：complete() 转给 FundingRecipient
余额 < 1 ETH：openToWithdraw = true，允许贡献者 withdraw()
```

关键点是：区块链没有定时器。`deadline` 到了以后，合约不会自动执行逻辑，必须有人发送交易调用 `execute()`，状态才会被推进。

## 专题二：最终合约代码

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./FundingRecipient.sol";

contract CrowdFund {
    /////////////////
    /// Errors //////
    /////////////////
    error NotOpenToWithdraw();
    error WithdrawTransferFailed(address to, uint256 amount);
    error TooEarly(uint256 deadline, uint256 currentTimestamp);

    //////////////////////
    /// State Variables //
    //////////////////////
    FundingRecipient public fundingRecipient;
    mapping(address => uint256) public balances;
    bool public openToWithdraw;
    uint256 public deadline = block.timestamp + 30 seconds;
    uint256 public constant threshold = 1 ether;

    ////////////////
    /// Events /////
    ////////////////
    event Contribution(address, uint256);

    ///////////////////
    /// Constructor ///
    ///////////////////
    constructor(address fundingRecipientAddress) {
        fundingRecipient = FundingRecipient(fundingRecipientAddress);
    }

    ///////////////////
    /// Functions /////
    ///////////////////

    function contribute() public payable {
        balances[msg.sender] += msg.value;
        emit Contribution(msg.sender, msg.value);
    }

    function withdraw() public {
        if (!openToWithdraw) {
            revert NotOpenToWithdraw();
        }

        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert WithdrawTransferFailed(msg.sender, amount);
        }
    }

    function execute() public {
        if (block.timestamp < deadline) {
            revert TooEarly(deadline, block.timestamp);
        } else {
            if (address(this).balance >= threshold) {
                fundingRecipient.complete{value: address(this).balance}();
            } else {
                openToWithdraw = true;
            }
        }
    }

    receive() external payable {
        contribute();
    }

    function timeLeft() public view returns (uint256) {
        if (block.timestamp <= deadline) {
            return deadline - block.timestamp;
        } else {
            return 0;
        }
    }
}
```

本地测试结果：`yarn test` → 13/13 PASSED。

## 专题三：地址角色与 `msg.sender`

这一关最容易混淆的是“谁在调用合约”。

| 地址 | 类型 | 作用 |
| --- | --- | --- |
| `0x6d1c...ca04` | EOA | 部署钱包，能签名交易 |
| `0x9cc1...Bd2` | Contract | `CrowdFund` 业务合约 |
| `0x3b56...35e3` | Contract | `FundingRecipient` 收款合约 |

`balances` 映射记录的是 `msg.sender` 的累计贡献，不是 `CrowdFund` 合约地址自己的贡献。

```solidity
mapping(address => uint256) public balances;

balances[msg.sender] += msg.value;
```

如果用 `balances[合约地址]` 查询，结果通常是 `0`，因为合约自己没有调用过 `contribute()`。应该查询贡献者的钱包地址。

## 专题四：贡献记账与事件

`contribute()` 必须用累加，而不是覆盖。

```solidity
balances[msg.sender] += msg.value;  // 正确：累计贡献
balances[msg.sender] = msg.value;   // 错误：覆盖上一次贡献
```

事件用于让前端、区块浏览器和索引器感知链上行为。

```solidity
event Contribution(address, uint256);

emit Contribution(msg.sender, msg.value);
```

事件不是合约状态本身，不能在 Solidity 中直接遍历查询；它更像链下系统读取的日志。

## 专题五：自定义错误

本关使用自定义错误替代字符串形式的 `require`。

```solidity
error NotOpenToWithdraw();
error TooEarly(uint256 deadline, uint256 currentTimestamp);

if (!openToWithdraw) {
    revert NotOpenToWithdraw();
}
```

自定义错误的好处是更省 gas，并且错误名和参数会写入 ABI，前端可以更准确地识别失败原因。

## 专题六：退款逻辑与 CEI 防重入

退款函数的关键是 CEI：Checks、Effects、Interactions。

```solidity
function withdraw() public {
    if (!openToWithdraw) {
        revert NotOpenToWithdraw();
    }

    uint256 amount = balances[msg.sender];
    balances[msg.sender] = 0;

    (bool success, ) = msg.sender.call{value: amount}("");
    if (!success) {
        revert WithdrawTransferFailed(msg.sender, amount);
    }
}
```

顺序必须是先检查、再改状态、最后对外转账。这里先把 `balances[msg.sender]` 清零，再用 `call` 发 ETH。

如果先转账再清零，而接收方是恶意合约，它可以在 `receive()` 中重入 `withdraw()`。因为余额还没清零，攻击者就能反复提款。

## 专题七：`call{value: ...}("")` 发 ETH

现代 Solidity 中推荐使用 `call` 发送 ETH。

```solidity
(bool success, ) = msg.sender.call{value: amount}("");
if (!success) revert WithdrawTransferFailed(msg.sender, amount);
```

| 方式 | gas 转发 | 评价 |
| --- | --- | --- |
| `transfer` | 固定 2300 gas | 不推荐，可能让合约钱包收款失败 |
| `send` | 固定 2300 gas | 不推荐，需要手动检查返回值 |
| `call{value: ...}("")` | 转发剩余 gas | 当前更通用，但必须配合 CEI 或重入保护 |

`call` 更灵活，但也更危险。它会把执行权交给接收方合约，所以状态更新必须发生在外部调用之前。

## 专题八：截止时间与阈值

合约使用 `block.timestamp` 表示当前区块时间。

```solidity
uint256 public deadline = block.timestamp + 30 seconds;
uint256 public constant threshold = 1 ether;
```

Solidity 的时间单位本质是乘数：

```solidity
30 seconds
5 minutes
2 hours
1 days
```

在本关中，`execute()` 只有在 deadline 到达后才能调用。

```solidity
if (block.timestamp < deadline) {
    revert TooEarly(deadline, block.timestamp);
}
```

测试中可以用 Foundry 的 `vm.warp` 快速改变区块时间，覆盖 deadline 前后两条路径。

## 专题九：`receive()` 的用户体验

`receive()` 让用户直接给合约转 ETH 时，也能走 `contribute()` 记账逻辑。

```solidity
receive() external payable {
    contribute();
}
```

如果没有 `receive()`，用户直接向合约转账可能会失败；或者在某些设计中，ETH 进了合约但没有记录到用户余额，导致退款时查不到贡献。

## 专题十：上线流程

本关使用 Foundry 版本的 Scaffold-ETH 2 模板。

```bash
npx create-eth@2.0.20 -e challenge-crowdfunding challenge-crowdfunding -s foundry
```

本地开发常用三个终端：

```bash
yarn chain
yarn deploy
yarn start
```

测试命令：

```bash
yarn test
yarn test --match-test 'Checkpoint1'
```

部署到 Sepolia 的核心流程：

```bash
yarn generate
yarn deploy --network sepolia
yarn verify --network sepolia
yarn vercel --prod
```

`.env` 中只应该放本地私密配置，不应提交到仓库或博客。

```env
DEPLOYER_KEYSTORE_ACCOUNT=<your_keystore_account>
ETHERSCAN_API_KEY=<your_etherscan_api_key>
```

## 专题十一：实战踩坑

### `withdraw` 失败：`NotOpenToWithdraw()`

`openToWithdraw` 默认是 `false`。只有众筹失败并调用 `execute()` 后，合约才会把它改成 `true`。

为了测试前端可以临时改成 `true`，但测试完必须恢复默认值，避免破坏真实业务状态。

### `timeLeft()` 条件写反

错误写法会在 deadline 之后计算 `deadline - block.timestamp`，Solidity 0.8+ 的下溢检查会直接 revert。

```solidity
if (block.timestamp < deadline) {
    return deadline - block.timestamp;
}

return 0;
```

### Solidity 没有 `then`

Solidity 的 `if` 语法没有 `then`。

```solidity
if (condition) {
    // ...
} else {
    // ...
}
```

### 成功分支不要写多余状态

如果众筹成功，资金会被转给 `FundingRecipient`。

```solidity
fundingRecipient.complete{value: address(this).balance}();
```

这里不需要额外设置 `openToWithdraw = false`。默认就是 `false`，成功分支也不应该开放退款。

### 直接转账测试 `receive()`

Debug Contracts 页面不一定提供 `receive()` 按钮。可以通过 MetaMask 直接发送 ETH，或用 `cast send` 对合约地址转账。

```bash
cast send <contract_address> --value 0.1ether --private-key <private_key>
```

注意：真实私钥不要写进博客、命令历史或仓库文件。

## 专题十二：项目结构

```text
challenge-crowdfunding/
├── packages/
│   ├── foundry/
│   │   ├── contracts/
│   │   │   ├── CrowdFund.sol
│   │   │   └── FundingRecipient.sol
│   │   ├── script/
│   │   │   ├── Deploy.s.sol
│   │   │   └── DeployCrowdFund.s.sol
│   │   ├── test/
│   │   │   └── CrowdFund.t.sol
│   │   ├── foundry.toml
│   │   ├── .env
│   │   └── keystore/
│   └── nextjs/
│       ├── scaffold.config.ts
│       ├── app/
│       │   ├── crowdfund/page.tsx
│       │   └── contributions/page.tsx
│       └── contracts/deployedContracts.ts
├── .challenge-ai/progress.json
├── AGENTS.md
├── CLAUDE.md
└── package.json
```

`keystore/`、`.env` 和各种 API key 都不能提交。博客文章只保留公开链上地址、公开交易哈希和通关流程。

## 核心收获

1. 众筹合约本质是状态机，状态迁移必须由交易触发。
2. `balances[msg.sender] += msg.value` 是退款记账的基础，不能覆盖。
3. `call` 发 ETH 必须配合 CEI，否则容易出现重入风险。
4. `block.timestamp` 只能作为链上时间参考，不能自动触发执行。
5. `receive()` 能改善直接转账体验，但必须确保它也走正确记账路径。
6. Foundry 测试比手测可靠，尤其适合覆盖时间、退款和重入边界。
7. Etherscan 验证让评审能直接读取源码，是公开测试网部署的一部分。

## 有用链接

- Challenge：https://speedrunethereum.com/challenge/crowdfunding
- 我的 Portfolio：https://speedrunethereum.com/builders/0x7FB24f7c6BE7fE61dA353E2A0fE38b310aE71f7
- Sepolia Etherscan：https://sepolia.etherscan.io
- Vercel：https://vercel.com
- Foundry 文档：https://book.getfoundry.sh
- Solidity 文档：https://docs.soliditylang.org

## 下一步

Ethereum 101 后续可以继续做 Token Vendor 和 Dice Game。Advanced 部分建议重点看 Build a DEX，因为它会把 ERC-20、AMM、流动性池和恒定乘积公式串起来，是理解 DeFi 的核心入口。
