---
title: "SpeedRunEthereum 靶场学习笔记 02：Token Vendor"
date: 2026-06-23 09:00:00
updated: 2026-06-25 09:00:00
categories:
  - "区块链开发"
  - "SpeedRunEthereum"
tags:
  - "SpeedRunEthereum"
  - "Solidity"
  - "Foundry"
  - "Scaffold-ETH 2"
  - "ERC-20"
  - "DeFi"
abbrlink: "speedrunethereum-token-vendor"
---
> 这是我的 SpeedRunEthereum 靶场个人学习笔记。第 2 关 Token Vendor 聚焦 ERC-20、固定汇率买卖、approve / transferFrom 授权、Ownable 权限控制、Sepolia 部署、Etherscan 验证和前端上线。

> **Challenge**: [speedrunethereum.com/challenge/token-vendor](https://speedrunethereum.com/challenge/token-vendor)
> **状态**: ✅ ACCEPTED（Ethereum 101 · 5/5）
> **框架**: Foundry
> **日期**: 2026/06/23
> **XP**: +10

---

## 📋 项目总览

去中心化**自动售货机** dApp，两个合约组成：

- **YourToken**：OpenZeppelin ERC-20（`Gold`/`GLD`），部署时铸造 1000 个
- **Vendor**：1 ETH = 100 GLD 的固定汇率合约，支持双向交易（买/卖）

### 真实场景

Token Vendor 模式是**自动做市商（AMM）**的最简形态，这个模式直接对应 DeFi 的核心协议：

- **Uniswap**：从固定汇率 → 恒定乘积（x·y=k）定价曲线的高级版。每天处理数十亿美元交易，无订单簿、无中介。
- **ERC-20 approve 模式**：你在这里写的 `approve` + `transferFrom` 是 **DeFi 通用机制**——Uniswap、Aave、Compound 全部用这个模式做合约间转账。
- **Ownable withdraw**：最简单的访问控制——只有 owner 能提 ETH。生产协议延伸为 timelock、multisig、DAO 治理。
- **Token economics**：固定供应 + Vendor 分发 = 简单代币分配机制，真实项目用 bonding curve、auction、airdrop，但核心一样。

**关键洞察**：Vendor 是 **trustless** 的——用户不需要信任你，他们在合约代码里**验证**汇率。任何人都可以审计，任何人都能交易。**这是 DeFi 的基石**：用透明、可审计的代码替代可信中介（银行、券商、交易所）。

---

## 🚀 部署信息（我的 Sepolia 上线）

| 项目 | 值 |
|------|-----|
| **YourToken** | `0x24ac227C28D204cD0Be8eE602Ef64c0549d03ed9` |
| **Vendor** | `0x657F8DC030c2756CFA4649695f9b8ED640f4554B` |
| **Deployer（keystore `kylinxin`）** | `0x6d1cd1d9f7226de5af18a7f9fd64e3aa6e81ca04` |
| **Vendor Owner（前端钱包）** | `0x7FB24f7c6BE7fE61dA353E2A0fEf38b310aE71f7` |
| **Vercel** | https://token-vendor-ky.vercel.app |
| **Etherscan（YourToken）** | https://sepolia.etherscan.io/address/0x24ac227C28D204cD0Be8eE602Ef64c0549d03ed9 |
| **Etherscan（Vendor）** | https://sepolia.etherscan.io/address/0x657F8DC030c2756CFA4649695f9b8ED640f4554B |
| **部署区块** | 11122928 |
| **部署总费用** | 0.00226 ETH（4 笔交易） |
| **网络** | Sepolia（chain id 11155111） |

### 链上验证数据

| 检查项 | 期望 | 实际 |
|--------|------|------|
| YourToken bytecode | > 0 | 3573 chars ✅ |
| YourToken name / symbol | "Gold" / "GLD" | ✅ |
| YourToken totalSupply | 1000 ether | 1e21 wei ✅ |
| Vendor bytecode | > 0 | 3837 chars ✅ |
| Vendor owner | `0x7FB2...` | ✅ |
| Vendor tokensPerEth | 100 | 100 ✅ |
| Vendor.yourToken 指向 | YourToken 地址 | ✅ |
| Vendor GLD 余额 | 1000 ether | 1e21 wei ✅ |

---

## 📜 最终合约代码

### `YourToken.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract YourToken is ERC20 {
    constructor() ERC20("Gold", "GLD") {
        // 部署时一次性铸造 1000 GLD 给 deployer
        // 1000 * 10**18 = 1e21 wei（ERC-20 默认 18 位小数）
        _mint(msg.sender, 1000 * 10 ** 18);
    }
}
```

### `Vendor.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./YourToken.sol";

contract Vendor is Ownable {
    /////////////////
    /// Errors //////
    /////////////////
    error InvalidEthAmount();
    error InsufficientVendorTokenBalance(uint256 vendorBalance, uint256 requestedAmount);
    error InvalidTokenAmount();
    error InsufficientVendorEthBalance(uint256 vendorBalance, uint256 requestedAmount);
    error EthTransferFailed(address to, uint256 amount);

    //////////////////////
    /// State Variables //
    //////////////////////
    YourToken public immutable yourToken;
    uint256 public constant tokensPerEth = 100;   // 1 ETH = 100 GLD

    ////////////////
    /// Events /////
    ////////////////
    event BuyTokens(address indexed buyer, uint256 amountOfETH, uint256 amountOfTokens);
    event SellTokens(address indexed seller, uint256 amountOfTokens, uint256 amountOfETH);

    ///////////////////
    /// Constructor ///
    ///////////////////
    constructor(address tokenAddress) Ownable(msg.sender) {
        yourToken = YourToken(tokenAddress);
    }

    ///////////////////
    /// Functions /////
    ///////////////////

    // CP2：用 ETH 买 GLD
    function buyTokens() external payable {
        if (msg.value == 0) revert InvalidEthAmount();
        uint256 amountToBuy = msg.value * tokensPerEth;

        uint256 vendorBalance = yourToken.balanceOf(address(this));
        if (vendorBalance < amountToBuy) {
            revert InsufficientVendorTokenBalance(vendorBalance, amountToBuy);
        }

        bool sent = yourToken.transfer(msg.sender, amountToBuy);
        require(sent, "Failed to transfer tokens");

        emit BuyTokens(msg.sender, msg.value, amountToBuy);
    }

    // CP3：Owner 提取 Vendor 积累的 ETH
    function withdraw() public onlyOwner {
        uint256 ownerAmount = address(this).balance;
        (bool sent, ) = owner().call{value: ownerAmount}("");
        if (!sent) revert EthTransferFailed(owner(), ownerAmount);
    }

    // CP4：用 GLD 卖回给 Vendor 拿 ETH
    function sellTokens(uint256 amount) public {
        if (amount == 0) revert InvalidTokenAmount();

        uint256 amountOfETH = amount / tokensPerEth;   // 整数除法，向下取整
        if (address(this).balance < amountOfETH) {
            revert InsufficientVendorEthBalance(address(this).balance, amountOfETH);
        }

        yourToken.transferFrom(msg.sender, address(this), amount);  // 从卖家拉

        (bool sent, ) = msg.sender.call{value: amountOfETH}("");
        if (!sent) revert EthTransferFailed(msg.sender, amountOfETH);

        emit SellTokens(msg.sender, amount, amountOfETH);
    }
}
```

**测试结果**：`yarn test` → **14/14 PASSED**（CP1: 2, CP2: 5, CP3: 3, CP4: 4）

---

## 🧠 核心知识点

### 1. 多种地址角色

| 地址 | 类型 | 作用 |
|------|------|------|
| `0x6d1c...ca04` 🟣 | **EOA（keystore `kylinxin`）** | Foundry 部署合约，签 deploy 交易 |
| `0x7FB2...77f7` 😎 | **EOA（MetaMask Burner Wallet）** | 前端操作，buy/sell/withdraw |
| `0x24ac...3ed9` 🎨 | **Contract（YourToken）** | ERC-20 实现 |
| `0x657F...54B` 🏪 | **Contract（Vendor）** | 自动售货机逻辑 |

**关键洞察**：`0x7FB2...` 看起来是 "the wallet"，但**它是 Vendor 的 owner，不是 deployer**。Deployer 是 `0x6d1c...`，owner 通过 `transferOwnership(0x7FB2...)` 转过去的。

---

### 2. ERC-20 基础

```solidity
// 继承 OpenZeppelin 标准实现
contract YourToken is ERC20 {
    constructor() ERC20("Gold", "GLD") {
        _mint(msg.sender, 1000 * 10 ** 18);
        //      ↑           ↑         ↑
        //      接收者      数量      1000 GLD 转 base 单位
    }
}
```

**为什么 `10 ** 18`？** ERC-20 默认 18 位小数（像 ETH 有 wei），所以：
- 1 GLD = 10^18 base units（类似 1 ETH = 10^18 wei）
- "1000 GLD" 在合约里其实是 `1000 * 10^18` 这个大整数
- 前端用 `formatEther()` 自动除以 10^18 显示成人类可读

**如果不乘 `10 ** 18` 呢？** 你会"铸造 1000 个最小单位"——人类角度看只有 `0.000000000000001 GLD`，几乎为 0。

---

### 3. `payable` 与 `msg.value`

```solidity
function buyTokens() external payable {           // payable 才能收 ETH
    if (msg.value == 0) revert InvalidEthAmount();  // 拒绝 0 ETH 攻击
    uint256 amountToBuy = msg.value * tokensPerEth;
    ...
}
```

| 变量 | 含义 |
|------|------|
| `msg.value` | 这笔交易附带的 ETH（单位 wei） |
| `msg.sender` | 调用者地址 |

**为什么 wei × 100 直接等于 token 数？** 因为**两边都是 18 位小数**，单位"刻度"一样。`0.1 ETH × 100 = 10 GLD`，数学完全自洽，不用换算。

---

### 4. Custom Errors（自定义错误）

```solidity
error InvalidEthAmount();
error InsufficientVendorTokenBalance(uint256 vendorBalance, uint256 requestedAmount);

if (msg.value == 0) revert InvalidEthAmount();
```

**对比老式 require**：

```solidity
// ❌ 老式：把字符串存链上，贵
require(msg.value > 0, "Must send ETH");

// ✅ 新式：只存 4 字节 selector，省 gas 80%
if (msg.value == 0) revert InvalidEthAmount();
```

**带参数的错误能告诉前端"差多少、当前多少"**——前端拿到错误能算差额、给提示。

**Selector 匹配**：测试用 `IVendor.InvalidEthAmount.selector` 匹配——**拼错一个字母就匹配不上**！

---

### 5. `indexed` 事件参数

```solidity
event BuyTokens(
    address indexed buyer,        // indexed → 进 topic，可被过滤
    uint256 amountOfETH,
    uint256 amountOfTokens
);
```

| 参数 | 是否 indexed | 原因 |
|------|------------|------|
| `buyer` | ✅ | 前端要查"某用户的所有买入" |
| `amountOfETH` | ❌ | 只展示用，不需要按它过滤 |
| `amountOfTokens` | ❌ | 同上 |

**为什么只 3 个 indexed？** EVM topic 数组最多 3 个槽，超过会 revert。

---

### 6. ERC-20 转账方向

| 场景 | 函数 | 调用方 | 资金方向 |
|------|------|--------|---------|
| **buyTokens** | `yourToken.transfer(msg.sender, amount)` | Vendor → User | Vendor 把自己的 GLD 发给买家 |
| **sellTokens** | `yourToken.transferFrom(msg.sender, address(this), amount)` | Vendor 拉 User 的 GLD | 买家授权后，Vendor 拉走 |

**为什么 sell 要 transferFrom？** 因为合约**不能主动**从用户钱包拿 token——必须用户先 `approve` 授权。

---

### 7. `approve` / `transferFrom` 模式 ⭐⭐⭐

**DeFi 最核心的模式。**

```solidity
// 第 1 步：用户在 YourToken 上授权 Vendor
yourToken.approve(vendorAddress, amount);
// = "我允许 Vendor 最多拿走 amount 个 GLD"

// 第 2 步：用户调 sellTokens，Vendor 用 transferFrom 拉走
yourToken.transferFrom(msg.sender, address(this), amount);
//   from=卖家  to=Vendor  amount=数量
```

**为什么非要两步？** 如果合约能直接 `transfer` 拿用户 token，任何 dApp 都能偷光你钱包。`approve` 是**用户主动的、精确控制的、可撤销的授权额度**：

| 维度 | 直接 transfer（不允许） | approve + transferFrom（允许） |
|------|----------------------|-----------------------------|
| 谁主动？ | 合约 | **用户** |
| 拿多少？ | 合约想拿多少 | **用户设定上限** |
| 可撤销？ | ❌ | ✅（再次 approve(0)） |
| 谁能查？ | 没人知道 | ✅ `allowance()` 公开可查 |

**这就是为什么**：Uniswap swap 前先 approve USDC、Aave deposit 前先 approve collateral——**全部同一个模式**。

---

### 8. 整数除法的"取整陷阱"

```solidity
uint256 amountOfETH = amount / tokensPerEth;   // 100
// 卖 99 GLD：99 / 100 = 0  ← 不是 0.99！直接变 0
// 卖 100 GLD：100 / 100 = 1  ← 1 ETH ✅
// 卖 199 GLD：199 / 100 = 1  ← 不是 1.99！
```

**Solidity 整数除法永远向下取整**。卖 99 GLD 只能换 0 ETH，等于免费送！

**生产代码**会用 OpenZeppelin 的 `Math.mulDiv` 或检查 `amount % tokensPerEth == 0` 拒绝不整除的情况。

---

### 9. `call{value:...}("")` 发 ETH（现代标准）

```solidity
(bool success, ) = msg.sender.call{value: amountOfETH}("");
if (!success) revert EthTransferFailed(msg.sender, amountOfETH);
```

| 方式 | 转发 gas | 备注 |
|------|---------|------|
| `transfer` | 固定 2300 | ❌ 合约钱包会挂（不够 gas） |
| `send` | 固定 2300 | ❌ 同上 |
| `call{value:...}("")` | **剩余全部** | ✅ 2024+ 行业标准 |

**为什么 2300 不够？** EIP-1884 之后 2300 gas 在某些 opcodes 上连基础 SLOAD 都不够。**Safe / Multisig 等合约钱包**收 ETH 时需要更多 gas 跑 receive 逻辑。

---

### 10. Ownable 访问控制

```solidity
contract Vendor is Ownable {
    constructor(...) Ownable(msg.sender) { ... }   // deploy 时 owner = deployer
    function withdraw() public onlyOwner { ... }    // 只有 owner 能调
}
```

**OpenZeppelin Ownable 提供**：

| 成员 | 作用 |
|------|------|
| `owner()` | 读当前 owner 地址 |
| `onlyOwner` 修饰符 | 限制函数只能 owner 调 |
| `transferOwnership(newOwner)` | 转交 owner 身份 |

**我们项目的 owner 转移链**：
```
Deploy 0x6d1c... → constructor: owner = 0x6d1c...
Deploy script: vendor.transferOwnership(0x7FB2...)
最终: owner = 0x7FB2...（你 MetaMask）
```

---

### 11. Emit 顺序：先做完，最后发事件

```solidity
yourToken.transferFrom(...);          // ① 状态变更
(bool sent, ) = msg.sender.call{...}("");  // ② ETH 发送
emit SellTokens(...);                 // ③ 最后 emit
```

**为什么？Solidity emit 不会自动撤销**——就算后面 revert，某些客户端短暂看到 emit。所以**先做完所有可能失败的检查和状态变更，最后 emit**——保证事件和数据一致。

---

## 🛠️ 完整上线流程

### Checkpoint 0：环境

```bash
node --version  # v25.2.1
yarn --version  # 1.22.22
forge --version # 1.5.1-stable

# 挑战模板
npx create-eth@2.0.20 -e challenge-token-vendor challenge-token-vendor -s foundry

# 三终端
yarn chain    # 终端1：Anvil（本地链）
yarn deploy   # 终端2：Foundry deploy（本地）
yarn start    # 终端3：Next.js dev
```

### AI 引导学习模式

`/start` → 教学 → 理解题 → 编码 → `check` 跑测试

每个 checkpoint 流程：
1. 讲 context（概念）
2. 问理解题（验理解）
3. 给编程任务（spec）
4. 用户写代码 → `check` 跑测试
5. 通过 → 下一个

### Foundry 测试命令

```bash
yarn test                                 # 全部 14 个
yarn test --match-test 'Checkpoint1'      # 单个
yarn test --match-test 'Checkpoint2'      # buyTokens
yarn test --match-test 'Checkpoint3'      # withdraw
yarn test --match-test 'Checkpoint4'      # sellTokens
```

---

### 📸 本地端到端测试截图

**1. 部署完，前端刷新前**——只显示余额，看不到 Buy 按钮（因为前端区块还是注释）：

![本地链初始状态：Your token balance 0.0000 GLD，Buy 按钮还没出现](/images/speedrunethereum/02-token-vendor-01-balance-zero.png)

> 此时 `packages/nextjs/app/token-vendor/page.tsx` 里 Buy Tokens 区块还是 `/* ... */` 注释状态——合约部署成功了，但前端 UI 没解锁。

**2. 解锁前端后，buy 110 GLD 成功**——4 个区块全部显示，数字自洽（987.9 + 12.1 = 1000）：

![buy 成功，Your balance 110 GLD，Vendor token 890 GLD，Vendor ETH 1.1 ETH](/images/speedrunethereum/02-token-vendor-02-buy-success.png)

**3. Debug Contracts + MetaMask**——确认合约 owner 是前端钱包：

![owner() 返回 0x7FB2...77f7（用户 MetaMask），yourToken 指向 0x82Dc...AccC，Vendor 余额 0](/images/speedrunethereum/02-token-vendor-03-owner-metamask.png)

**4. MetaMask 网络配置**——Chain ID 31337，RPC `127.0.0.1:8545`：

![MetaMask 编辑网络：Localhost / 127.0.0.1:8545 / Chain ID 31337 / ETH](/images/speedrunethereum/02-token-vendor-04-localhost-network.png)

**5. 完整端到端 4 区块**——Your / Vendor Balances / Buy / Sell 都工作：

![完整 UI：Your balance 987.9 GLD，Vendor token 12.1，Vendor ETH 9.879，Buy 输入 900，Transfer + Sell 区块可见](/images/speedrunethereum/02-token-vendor-05-end-to-end.png)

---

### 上线 Sepolia

```bash
# 1. 把 MetaMask 私钥导入 Foundry keystore
cast wallet import --private-key 0x...你的私钥... kylinxin
# → Foundry 提示输入密码，输两遍（不是 MetaMask 密码）

# 2. 配置 .env（已有 ALCHEMY + ETHERSCAN API key）

# 3. Sepolia faucet 拿 ETH（给 0x7FB2... 充至少 0.05 ETH）
# → https://sepoliafaucet.com/ 或 Google/Infura

# 4. 部署
yarn deploy --network sepolia
# → 选 kylinxin keystore（不要选 scaffold-eth-default）
# → 输入 keystore 密码
# → 等 ~30s - 2min，看到 4 笔 transactions success

# 5. 验证合约（上传源码到 Etherscan）
yarn verify --network sepolia
# → 不需要密码（不发交易）

# 6. 改前端切到 Sepolia
# packages/nextjs/scaffold.config.ts:
targetNetworks: [chains.sepolia],

# 7. 解锁前端 Sell Tokens 区块 + events/page.tsx SellTokens Events hook
# (见下文"踩坑 4")

# 8. 部署前端
yarn vercel --prod
# → 第一次会让你登录 Vercel + 创建项目

# 9. 提交到 speedrunethereum.com
```

---

## 🐛 实战踩过的坑

### 1. ❌ 错误拼写 `InvaildTokenAmount`

```solidity
// ❌ 我的拼写错误
error InvaildTokenAmount();
revert InvaildTokenAmount();

// ✅ spec 要求
error InvalidTokenAmount();
revert InvalidTokenAmount();
```

**症状**：测试报 `Error != expected error: InvaildTokenAmount() != InvalidTokenAmount()`

**原因**：Solidity error 名通过 `keccak256("InvalidTokenAmount()")[0..4]` 算出 4 字节 selector。**拼错一个字母 → selector 不同 → 测试匹配不上**。

**教训**：**永远对着 spec 抄错误名**——多一个字母少一个字母都失败。声明处、调用处、测试里都得一致。

---

### 2. ❌ Foundry + MetaMask nonce 冲突

**症状**：`yarn deploy --network sepolia` 报：
```
Error: Failed to send transaction after 4 attempts
Err: replacement transaction underpriced
```

**诊断**：Sepolia Etherscan 查 deployer 历史，发现 nonce 132 是 MetaMask 发的 ETH 转账，**不是** Foundry 的 deploy。

**根因**：Foundry 和 MetaMask 共享**同一个账户的 nonce 计数器**：
```
时间线：
  MetaMask：   准备发 nonce 132 的 ETH 转账
  Foundry：    模拟成功，准备发 nonce 132 的 YourToken deploy
  ↓
  MetaMask 的 132 先广播 → Foundry 想用更高 gas 替换
  Foundry 的 replacement gas 不够高 → 4 次重试都失败
```

**解决**：
1. 跑 Foundry 时**关掉 MetaMask**，或者别在 MetaMask 里点发送
2. 让 Foundry 跑完 4 笔 deploy 交易（不要 Ctrl+C！）
3. 等 MetaMask 那笔 nonce 132 上链确认后，Foundry 自动用 nonce 133+

**长期建议**：**Foundry 部署批量脚本** + **MetaMask 手动单笔**——两者不该共用同一个 nonce 计数器。

---

### 3. ❌ 部署脚本 broadcast 失败但 simulation 成功

```bash
== Logs ==
  YourToken deployed at: 0x24ac2...        # 模拟算的地址
  Vendor deployed at: 0x657F8...

##### sepolia
✅ [Success] Hash: 0x5db7b7e8...        # 真发了
Block: 11122928
```

**`run-latest.json` 里 `hash: null`** 表示 broadcast 没真发出去。检查方法：

```bash
# 查链上合约有没有 bytecode
cast code 0x24ac227C28D204cD0Be8eE602Ef64c0549d03ed9 \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/KEY | wc -c
# 3 chars = "0x\n" → 没部署
# > 1000 chars → 部署成功
```

---

### 4. ❌ Vercel build 失败：`isSellEventsLoading is not defined`

**症状**：
```
Error occurred prerendering page "/events"
ReferenceError: isSellEventsLoading is not defined
```

**根因**：`events/page.tsx` 处于**半解锁状态**——区块解锁了但 hook 没解锁：
```tsx
// hook 还是注释
// const { data: sellTokenEvents, isLoading: isSellEventsLoading } = ...

// 区块已经解锁，引用了 hook 里的变量
{isSellEventsLoading ? (...) : (...)}
```

**修复**：把 hook 的 `//` 注释去掉，**hook 和区块必须同步解锁**。

**为什么本地 dev 不报错？** Next.js dev 模式宽松，build 模式才会预渲染所有页面 → 触发静态分析。

---

### 5. ❌ 前端 Buy Tokens 按钮没出现

**症状**：Token Vendor 页只显示 "Your token balance: 0.0000 GLD"，看不到 Vendor 余额、Buy 按钮。

**根因**：`packages/nextjs/app/token-vendor/page.tsx` 里的几个区块初始状态是 `/* ... */` 注释，需要手动解锁：

```tsx
// Vendor Balances 区块
const { data: vendorTokenBalance } = useScaffoldReadContract(...);   // 解开
const { data: vendorEthBalance } = useWatchBalance(...);              // 解开
const { data: tokensPerEth } = useScaffoldReadContract(...);          // 解开

{/* <div>Buy Tokens</div> */}  →  <div>Buy Tokens</div>               // 解开
```

**教训**：Scaffold-ETH 2 把 UI 分阶段解锁——合约写了但 UI 没解锁 → 用户看不到效果。

---

### 6. ❌ Foundry 默认 keystore vs 你的 keystore

```bash
# Foundry 默认 keystore（scaffold-eth-default）
$ cast wallet address --account scaffold-eth-default --password localhost
0xa0Ee7A142d267C1f36714E4a8F75612F20a79720    # Anvil 内置 9 号账户

# 我导入的 keystore（kylinxin）
$ cast wallet address --account kylinxin --password <你的密码>
0x6d1cd1d9f7226de5af18a7f9fd64e3aa6e81ca04    # 你的真实 MetaMask
```

**关键区别**：
- 默认 keystore 是 Anvil 内置，**Sepolia 上没 ETH**
- kylinxin keystore 是你的真实钱包，Sepolia faucet 可以充钱

**部署到测试网必须用你自己的 keystore**，否则 gas 都付不起。

---

### 7. ❌ Vercel `targetNetworks: [chains.foundry]`

部署完合约到 Sepolia，但前端还是连本地链！

**修复**：
```ts
// packages/nextjs/scaffold.config.ts
targetNetworks: [chains.foundry],   // ❌
targetNetworks: [chains.sepolia],   // ✅
```

---

## 💡 关键心得

1. **ERC-20 approve 是 DeFi 的通用语**——学完 Vendor 等于学完 Uniswap / Aave / Compound 的核心交互。
2. **整数除法永远向下取整**——99 GLD / 100 = 0，不是 0.99。
3. **错误名是 Selector，不是 Label**——拼错 = 测试全挂。
4. **`call{value:...}` 现代标准**——`transfer` 在合约钱包时代已经过时。
5. **Emit 最后发**——状态变更完后再 emit，避免数据不一致。
6. **Foundry 和 MetaMask 别共用账户**——nonce 会撞。
7. **前端解锁 = 修改 `/* */` 注释**——Scaffold-ETH 把 UI 分阶段教。
8. **Vercel build 比 dev 严格**——dev 能跑不代表 build 能过。
9. **Owner ≠ Deployer**——deploy 后通过 `transferOwnership` 转交。
10. **CEI 顺序同样适用**——`call` 发 ETH 也是外部调用，理论上需要防重入（虽然本挑战卖 token 时已经先 transferFrom 改了状态）。

---

## 🔗 有用的链接

- Challenge: https://speedrunethereum.com/challenge/token-vendor
- 我的 Portfolio: https://speedrunethereum.com/builders/0x7FB24f7c6BE7fE61dA353E2A0fE38b310aE71f7
- 我的 dApp: https://token-vendor-ky.vercel.app
- Sepolia Etherscan: https://sepolia.etherscan.io
- Sepolia 水龙头：
  - https://www.alchemy.com/faucets/ethereum-sepolia
  - https://cloud.google.com/application/web3/faucet
  - https://www.infura.io/faucet/sepolia
- Vercel: https://vercel.com
- Foundry 文档: https://book.getfoundry.sh
- OpenZeppelin ERC20: https://docs.openzeppelin.com/contracts/5.x/erc20
- OpenZeppelin Ownable: https://docs.openzeppelin.com/contracts/5.x/access-control

---

## 📁 项目文件结构

```
challenge-token-vendor/
├── packages/
│   ├── foundry/
│   │   ├── contracts/
│   │   │   ├── YourToken.sol              # CP1: ERC-20 + _mint
│   │   │   └── Vendor.sol                 # CP2/3/4: buy/withdraw/sell
│   │   ├── script/
│   │   │   ├── Deploy.s.sol               # 主入口
│   │   │   ├── DeployYourToken.s.sol      # 部署 + FRONTEND_ADDRESS + SEND_TOKENS_TO_VENDOR
│   │   │   └── VerifyAll.s.sol            # 自动 verify 所有 CREATE 交易
│   │   ├── test/
│   │   │   └── Vendor.t.sol               # Foundry 测试（14 个）
│   │   ├── foundry.toml                   # 网络 + RPC 配置
│   │   └── .env                           # ALCHEMY/ETHERSCAN API key
│   └── nextjs/
│       ├── scaffold.config.ts             # targetNetworks: [chains.sepolia]
│       ├── app/
│       │   ├── token-vendor/page.tsx      # 主 UI（Your/Vendor/Buy/Transfer/Sell 区块）
│       │   └── events/page.tsx            # BuyTokens + SellTokens 事件表
│       └── contracts/deployedContracts.ts # 部署后自动生成 ABI
├── .challenge-ai/progress.json            # AI 引导模式进度
├── AGENTS.md                              # 项目 AI 指令
├── CLAUDE.md                              # 引用 AGENTS.md
└── package.json                           # yarn workspace 根
```

---

## 🎓 Ethereum 101 完成记录

**Ethereum 101 当前进度**：4/4
- ✅ Tokenization
- ✅ Crowdfunding
- ✅ **Token Vendor**（本次）
- ✅ Dice Game

**Ethereum 101 完成后推荐方向**：
- 🚀 **Build a DEX** — 流动性池 + 恒定乘积（`x*y=k`），把 Vendor 的固定汇率升级成动态定价
- 🔮 **Oracles** — 链下数据（价格、天气）怎么上链
- 💰 **Over-Collateralized Lending** — DeFi 借贷基础（Aave 简化版）
- 🔐 **ZK Proofs** — 零知识证明入门

**Token Vendor → DEX 的核心跳跃**：
```
固定汇率        →  动态定价曲线
1 ETH = 100 GLD →  x * y = k
单一价格        →  根据流动性深度自动调整
```

---

## 📝 SpeedRunEthereum 提交记录

- ✅ Vercel URL: https://token-vendor-ky.vercel.app
- ✅ Sepolia 合约：
  - YourToken: `0x24ac227C28D204cD0Be8eE602Ef64c0549d03ed9`
  - Vendor: `0x657F8DC030c2756CFA4649695f9b8ED640f4554B`
- ✅ SpeedRunEthereum 状态：本关 ACCEPTED；系列当前 4/4
