---
title: "SpeedRunEthereum 靶场学习笔记 04：Build a DEX"
date: 2026-06-25 09:00:00
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
  - "AMM"
abbrlink: "speedrunethereum-build-a-dex"
---
> 这是我的 SpeedRunEthereum 靶场个人学习笔记。第 4 关 Build a DEX 聚焦 AMM 恒定乘积定价、ERC-20 approve / transferFrom 授权、swap、加撤流动性、CEI 安全模式，以及 Scaffold-ETH Debug 标签页联调。

> **Challenge**: [speedrunethereum.com/challenge/build-a-dex](https://speedrunethereum.com/challenge/build-a-dex)
> **状态**: ✅ COMPLETED（Ethereum 101 · 5/5；12/12 Foundry 测试、Debug 标签页 UI 实测、swap 和 deposit/withdraw 对账均已完成）
> **框架**: Foundry + Scaffold-ETH 2
> **日期**: 2026/06/25
> **XP**: +10（Ethereum 101 · 5/5）

---

## 📋 项目总览

这个挑战要你**从零写一个完整的 AMM DEX**（自动做市商去中心化交易所），参照 Uniswap V2 的设计。5 个 Checkpoint 覆盖：

| CP | 主题 | 函数 | 难度 |
|----|------|------|------|
| **CP2** | 初始化 + 流动性查询 | `init`, `getLiquidity` | ⭐ |
| **CP3** | 定价数学 | `price` | ⭐⭐ |
| **CP4** | 交易 (swap) | `ethToToken`, `tokenToEth` | ⭐⭐⭐ |
| **CP5** | 加撤流动性 | `deposit`, `withdraw` | ⭐⭐⭐⭐ |

**最终成果**：7 个函数 + 2 个 view，**12/12 测试全绿**，Debug 标签页实测 4 个 swap 场景与 deposit/withdraw 对账都符合预期。

### 教学价值（这个挑战想让你懂的）

1. **AMM（自动做市商）核心数学** —— 恒定乘积公式 `x·y = k`
2. **ERC20 深入** —— 账本模型、approve 流程、OZ v5 行为
3. **Solidity 工程实践** —— `payable` / `msg.value` / `address(this).balance` 陷阱
4. **DeFi 安全模式** —— CEI（Checks → Effects → Interactions）
5. **前端 + 合约联调** —— Scaffold-ETH Debug 标签页 + ABI 错误诊断

---

## 🧠 核心概念（先理解这些再写代码）

### 1. AMM 恒定乘积公式

DEX 跟传统订单簿交易所**完全不同**——它**没有买卖单**，而是用一个数学公式自动定价。

```
x · y = k
```

在无手续费的理想模型里，swap 前后的 `k` 保持不变；加入 0.3% 手续费后，手续费留在池子里，`k` 会随交易增长，LP 的份额价值也因此增加。

- `x` = 池子里的 ETH 数量
- `y` = 池子里的 token 数量
- 用户拿 `Δx` ETH 进来换 token，池子的 `y` 必须**减少**，使无手续费部分满足恒定乘积约束
- 拿走的 token = `y - k/(x + Δx)`

**直觉**：您放越多 ETH 进来，单位 ETH 能换的 token **越少**（被数学"惩罚"）。这阻止了"一次性抽干池子"。

### 2. 0.3% 手续费（997/1000 优化）

Uniswap V2 收 0.3% 手续费，**LP 凭证持有者赚这钱**。

数学上等价于"用户的输入只有 99.7% 真的参与定价"：

```
xInputWithFee = xInput × 997 / 1000
yOutput = yReserves × xInputWithFee / (xReserves + xInputWithFee)
```

**为什么要 `997/1000` 而不是直接 `× 0.003`？** 因为 Solidity 是整数除法，**先除会丢精度**。把 1000 留到分母、997 留到分子，最后一步除法自然约掉，**保留最大精度**。

### 3. ERC20 账本模型（关键反直觉点）

**很多人误以为** ERC20 token "装"在合约里——**错**。

ERC20 合约是**记录"谁有多少 token"的账本（数据库）**，不是装币的容器。

看 `Balloons.sol`：

```solidity
contract Balloons is ERC20 {
    constructor() ERC20("Balloons", "BAL") {
        _mint(msg.sender, 1000 ether); // mints 1000 balloons!
    }
}
```

`_mint(msg.sender, 1000 ether)` 在合约的 storage 里：

```solidity
totalSupply = 1000 ether         // 总账
balanceOf[deployer] = 1000 ether  // deployer 名下
balanceOf[Balloons合约自己] = 0   // 合约自己不持有！
```

**证明**：在 Debug 选 `Balloons` 合约 → `balanceOf(Balloons合约自己的地址)` → 永远是 **0**。这就是账本模型的"**账本本身不持币**"。

![Balloons 合约视图 - totalSupply 1000](/images/speedrunethereum/04-dex-04-balloons-contract-view.png)

| 概念 | 现实类比 |
|------|---------|
| ETH | 真实的"币"，存在地址上（地址.balance 增减） |
| ERC20 token | 数字，"记录在"合约的 mapping 里（合约更新 balanceOf[X]）|

### 4. Approve + TransferFrom 模式

ERC20 标准规定：**你的钱，必须你主动同意别人才能动**。

| 步骤 | 调什么 | 效果 |
|------|--------|------|
| ① | `balloons.approve(dex, 100e18)` | "我同意让 DEX 拉我 100 token"（不发生转账，只改 allowance） |
| ② | `dex.init{value: 1e18}(1e18)` | 用户发 1 ETH + 1 token 给 DEX |
| ③ | DEX 内部 `balloons.transferFrom(user, dex, 1e18)` | 真正把 1 token 从 user 账本划到 DEX 账本 |

**为什么不直接 `transfer`？** 因为 `transfer` 是 user 先发一笔，再发 ETH，**两笔交易存在不同步和被抢跑风险**。`approve + transferFrom` 把 ETH 和 token 的进入放在同一笔交易里，保证原子完成。

### 5. CEI 安全模式

Solidity 函数的最佳实践顺序：

```
① Checks     — 校验输入
② Effects    — 修改 state 变量
③ Interactions — 外部调用（transfer、emit）
```

**为什么 Effects 在前？** 万一外部调用触发了用户合约的 fallback 重入，**重入时看到的是已更新的 state**，不会被攻击。

---

## 📂 项目结构

```
packages/foundry/
├── contracts/
│   ├── Balloons.sol       # 测试用 ERC20 token（DO NOT EDIT）
│   ├── DEX.sol            # 我们的 DEX（核心实现）
│   └── IDEX.sol           # DEX 接口（DO NOT EDIT，定义函数签名）
└── test/
    └── DEX.t.sol          # Foundry 测试，12 个测试覆盖 5 个 CP

packages/nextjs/
├── app/debug/             # Debug 标签页（手动调合约）
└── contracts/
    └── deployedContracts.ts  # 自动生成，记录部署的 ABI
```

### Debug 标签页能看到的所有函数

![Debug 标签页的函数列表](/images/speedrunethereum/04-dex-03-debug-tab-functions.png)

---

## 🛠️ Checkpoint 2: 初始化 + 流动性查询

### 目标

实现 `init()` 创建池子 + `getLiquidity()` 查询 LP 余额。

### 1. immutable vs constant

`DEX.sol` 顶部 state variable：

```solidity
IERC20 public immutable token;     // ← 这个用 immutable
uint256 public totalLiquidity;
mapping(address => uint256) public liquidity;
```

| 维度 | `constant` | `immutable` |
|------|----------|-----------|
| 赋值时机 | **编译时** | **部署时**（constructor 内）|
| 能存什么 | 值类型、`string`、`bytes` | **任意类型**（含合约引用）|
| 存储位置 | 内联到字节码 | 存在字节码尾部（CODESLOAD）|
| Gas | 最便宜 | 略贵一点点（仍比 SLOAD 便宜）|

**为什么 `token` 用 immutable？** 因为它是 `IERC20`（合约地址），**地址只有部署那一刻才知道**——`constant` 要求编译期就知道值，做不到。但地址一旦在 constructor 设好就再不变，**逻辑上是常量，只是赋值时机晚一点** → `immutable` 正是为此设计。

### 2. `init()` 完整实现

```solidity
function init(uint256 tokens) public payable returns (uint256 initialLiquidity) {
    if (totalLiquidity > 0) {
        revert DexAlreadyInitialized();
    }
    totalLiquidity = address(this).balance;
    liquidity[msg.sender] = totalLiquidity;
    if (!token.transferFrom(msg.sender, address(this), tokens)) {
        revert TokenTransferFailed();
    }
    return totalLiquidity;
}
```

**逐行解析（做什么 / 为什么 / 怎么写）**：

#### L1-L3：守卫
```solidity
if (totalLiquidity > 0) {
    revert DexAlreadyInitialized();
}
```

- **做什么**：如果池子已经被初始化过，revert 抛错
- **为什么**：DEX 只能 init **一次**——第一次 init 设定了 ETH/token 的初始价格比率（1:1）。如果允许第二次 init，攻击者可以操纵初始价格
- **怎么写**：用 `revert CustomError()` 模式，比 `require` 字符串省 gas

#### L4-L5：设置总 LP + 给第一个 LP 发凭证
```solidity
totalLiquidity = address(this).balance;
liquidity[msg.sender] = totalLiquidity;
```

- **做什么**：把"池子里全部的 ETH 数量"记为总流动性，并把这个数量给 msg.sender
- **为什么**：`address(this).balance` 自动包含 msg.value；LP 数量 = 投入的 ETH 数量，让"1 wei 的 LP 凭证 = 当时池子里的 1 wei ETH"——这个 1:1 锚定是后续所有 LP 增减的计算基础
- **怎么写**：用 `address(this).balance` 而不是 `msg.value`——两者此刻数值相同，但用 balance 更"诚实"（未来如果有 `selfdestruct` 强制塞 ETH，balance 会变，msg.value 不会）

#### L6-L8：拉 token 进来
```solidity
if (!token.transferFrom(msg.sender, address(this), tokens)) {
    revert TokenTransferFailed();
}
```

- **做什么**：从调用者那里**拉取** `tokens` 数量的 ERC20 代币到合约
- **为什么用 `transferFrom` 而不是 `transfer`？** `transferFrom` 走 approve 流程，配合 `payable` 实现**原子性**（ETH 和 token 一笔交易同进同出）
- **为什么检查返回值？** ERC20 标准规定 `transferFrom` 返回 `bool`——但不检查的话，失败会**静默成功**，LP 凭空多出 ETH 份额

#### ⚠️ 隐藏的 Bug：死代码

**`if (!token.transferFrom(...))` 实际上是死代码**——OpenZeppelin v5 的 `transferFrom` **不会**返回 false，失败直接 revert（抛 `ERC20InsufficientAllowance`）。所以 `TokenTransferFailed` 这个 revert 永远走不到。不过写上无害，是"防御性编程"。

### 3. 实战踩坑：0xfb8f41b2

第一次在 Debug 调 init 报错：

![init 报错 0xfb8f41b2](/images/speedrunethereum/04-dex-01-init-error-0xfb8f41b2.png)

前端显示 `0xfb8f41b2 not found on ABI`。我**用 cast 算**了一下：

```bash
$ cast sig "ERC20InsufficientAllowance(address,uint256,uint256)"
0xfb8f41b2
```

**真相**：这是 **OpenZeppelin v5 的标准错误**，来自 **Balloons 合约**，不是 DEX。

| 原因 | 我没给 Balloons 授权 DEX 拉 token |
|------|--------------------------------|
| 流程 | approve 是 ERC20 的"拉钱"前置条件 |
| 解法 | 先调 `balloons.approve(dex, 1e18)`，再调 `init` |

**教训**：前端 ABI 找不到错误选择器时，**不要只看调用入口的 ABI，要怀疑子调用**。

### 4. `init()` 成功后的状态

![init 成功后的 DEX 状态](/images/speedrunethereum/04-dex-05-dex-after-init.png)

| 状态变量 | 值 | 含义 |
|---------|---|------|
| `totalLiquidity` | `1e18` | DEX 发行的 LP 总量 = 1 ETH |
| `liquidity[user]` | `1e18` | 第一个 LP 拿到 100% 的 LP |
| `address(dex).balance` | 1 ETH | 池子里的 ETH |
| `token.balanceOf(dex)` | 1 | 池子里的 token |

---

## 🧮 Checkpoint 3: 定价函数

### 目标

实现 `price()` —— **纯计算**，不动 state。

### 1. 完整实现

```solidity
function price(uint256 xInput, uint256 xReserves, uint256 yReserves)
    public pure returns (uint256 yOutput)
{
    uint256 xInputWithFee = xInput * 997;
    yOutput = (yReserves * xInputWithFee) / (xReserves * 1000 + xInputWithFee);
}
```

### 2. 为什么是 `pure` 不是 `view`？

| 修饰符 | 能否读 state | 能否写 state | 何时用 |
|--------|----------|----------|------|
| `pure` | ❌ | ❌ | 纯计算 |
| `view` | ✅ | ❌ | 读 storage |

`price()` **不读** `token`、`totalLiquidity`、**任何 storage**——三个参数都从外面传进来。所以可以且**应该**是 `pure`——在编译期禁止它读取 storage，**更安全 + 更省 gas**。

### 3. 公式推导（x · y = k + 0.3% 手续费）

设用户输入 `Δx`，fee = 0.3%，实际参与定价是 `Δx × 997/1000`：

```
(x + Δx · 997/1000) · (y - Δy) = x · y
```

解出 `Δy`：

```
Δy = y · Δx · 997 / (x · 1000 + Δx · 997)
```

**这正是测试断言的值**——手算验证：

```
price(1e18, 5e18, 5e18)
= 5e18 × 1e18 × 997 / (5e18 × 1000 + 1e18 × 997)
= 4.985e39 / 5.997e21
= 0.8312489578... × 1e18
= 831248957812239453 wei   ✅
```

### 4. 手算举例（为什么不是 1.0）

直觉：池子里 5 ETH 和 5 token，"公允价值"是 1 ETH = 1 token。投 1 ETH 应该换 1 token 才"公平"。

**但实际只换到 0.8312 token**——少了约 17%！两个损失叠加：

#### 损失 ①：AMM 滑点
不带手续费，投 1 ETH 进去：
- 池子变成 6 ETH，要保持 k=25 → token 池 = 25/6 ≈ 4.167
- 拿 `5 - 4.167 = 0.833` token

#### 损失 ②：0.3% 手续费
手续费扣的是"输入"：1 ETH → 0.003 ETH = 手续费 → **只有 0.997 ETH 进池子定价**

| 阶段 | 池子 ETH | 池子 token | 我能拿走 |
|------|---------|-----------|---------|
| 初始 | 5 | 5 | 0 |
| 投 0.997 ETH 后（扣 0.3% 费）| 5.997 | 4.169 | **0.8312** ✅ |

手续费留在池子里，让 LP 凭证越来越值钱——**这就是 LP 怎么赚钱**。

### 5. 实战踩坑：price 返回 0

我以为 `forge test` 通过就 OK，结果去 Debug 调 `price(1e18, 5e18, 5e18)` 返回 **0**：

![price 返回 0](/images/speedrunethereum/04-dex-02-price-returns-zero.png)

**原因**：**链上部署的合约是旧版本**（部署时 price() 函数体还是空注释 `// Your code here...`），新代码只在我电脑上编译过，没部署到链上。

**`forge test` 跑的是测试时新编译的代码，但前端连的是链上已部署的旧合约实例**——两个东西完全不同。

| 方式 | 代码来源 |
|------|---------|
| `forge test` | 每次跑测试都**重新编译并部署**新合约实例 |
| Scaffold-ETH 前端 | 连的是**本地链上已部署的合约实例**（不会自动重编译）|

**修法**：

```bash
# 1. 停掉 yarn chain（Ctrl+C）
# 2. 重启 yarn chain
yarn chain
# 3. 重部署（必须加 --reset）
yarn deploy --reset
# 4. 刷前端
Cmd/Ctrl + R
```

**教训**：改完合约 → `forge build` → `forge test` → `yarn deploy --reset` → 刷前端，**5 步缺一不可**。

---

## 🔄 Checkpoint 4: 交易 (swap)

### 目标

实现 `ethToToken()`（ETH → token）和 `tokenToEth()`（token → ETH）。

### 1. 完整实现

```solidity
function ethToToken() public payable returns (uint256 tokenOutput) {
    if (msg.value == 0) revert InvalidEthAmount();
    uint256 xReserves = address(this).balance - msg.value;
    uint256 yReserves = token.balanceOf(address(this));
    tokenOutput = price(msg.value, xReserves, yReserves);
    if (!token.transfer(msg.sender, tokenOutput)) revert TokenTransferFailed();
    emit EthToTokenSwap(msg.sender, msg.value, tokenOutput);
}

function tokenToEth(uint256 tokenInput) public returns (uint256 ethOutput) {
    if (tokenInput == 0) revert InvalidTokenAmount();
    uint256 xReserves = token.balanceOf(address(this));
    uint256 yReserves = address(this).balance;
    ethOutput = price(tokenInput, xReserves, yReserves);
    if (!token.transferFrom(msg.sender, address(this), tokenInput)) revert TokenTransferFailed();
    payable(msg.sender).transfer(ethOutput);
    emit TokenToEthSwap(msg.sender, tokenInput, ethOutput);
}
```

### 2. 关键知识点

#### 知识点 ①：Solidity 收 ETH 的"快照陷阱"

**事实**：当 `payable` 函数开始执行时，`msg.value` **已经加到了** `address(this).balance`。

**陷阱**：

```solidity
function ethToToken() public payable returns (uint256 tokenOutput) {
    // ❌ 错！这样读到的是"包含 msg.value" 的余额
    uint256 xReserves = address(this).balance;

    // ✅ 对！减掉 msg.value 才是"调用前"的旧余额
    uint256 xReserves = address(this).balance - msg.value;
}
```

**为什么这样写**：price() 的数学用的是"swap 之前池子里有多少"。msg.value 是 swap 的一部分，不应该算进旧储备。

| 函数 | 要不要减 msg.value |
|------|------------------|
| `ethToToken` (payable) | ✅ 要减 |
| `tokenToEth` (nonpayable) | ❌ 不用减（没新 ETH 进来）|
| `deposit` (payable) | ✅ 要减 |
| `withdraw` (nonpayable) | ❌ 不用减 |

#### 知识点 ②：Push vs Pull 模式

| 方向 | 函数 | 场景 |
|------|------|------|
| **合约 → 用户** | `token.transfer(to, amount)` | 合约主动 push（不需要 approve）|
| **用户 → 合约** | `token.transferFrom(from, to, amount)` | 合约主动 pull（**需要先 approve**）|

| swap 方向 | 用的函数 |
|----------|---------|
| `ethToToken`（ETH → token）| `token.transfer` (push token 给用户) |
| `tokenToEth`（token → ETH）| `token.transferFrom` (pull token 进来) + `payable(msg.sender).transfer` (push ETH 给用户) |

#### 知识点 ③：`payable(msg.sender).transfer()` 转 ETH

```solidity
payable(msg.sender).transfer(ethOutput);
```

- `payable(...)` 强转：`msg.sender` 是 `address` 类型，**Solidity 类型系统要求** `payable address` 才能付 ETH
- `.transfer()`：失败自动 revert，固定 2300 gas；它不能替代完整的反重入设计，本关真正依赖的安全顺序仍是 CEI

#### 知识点 ④：CEI 模式（Checks → Effects → Interactions）

```solidity
function tokenToEth(uint256 tokenInput) public returns (uint256 ethOutput) {
    // ① Checks
    if (tokenInput == 0) revert InvalidTokenAmount();

    // ② 先基于调用前快照完成输出计算
    uint256 xReserves = token.balanceOf(address(this));
    uint256 yReserves = address(this).balance;
    ethOutput = price(tokenInput, xReserves, yReserves);

    // ③ Interactions
    token.transferFrom(msg.sender, address(this), tokenInput);
    payable(msg.sender).transfer(ethOutput);
    emit TokenToEthSwap(msg.sender, tokenInput, ethOutput);
}
```

**核心原则**：**所有算账用"调用前"的状态**。如果先转账再算，balanceOf 已经变了，算的 ethOutput 是按"已经被改变的池子"算的——**对用户不利**。

#### 知识点 ⑤：Events 是什么

`emit` 是合约主动发到链上的"日志"——**不影响状态、不消耗太多 gas**。DeFi 生态的"神经系统"：前端 / The Graph / Dune Analytics 靠它知道发生了什么。

```solidity
event EthToTokenSwap(address swapper, uint256 ethInput, uint256 tokenOutput);
```

事件签名必须**严格匹配 IDEX 接口**（包括 `indexed` 关键字的位置）——否则 ABI 对不上，前端查不到事件。

### 3. 完整 swap 生命周期时序图

```
用户                          DEX 合约                    Balloons 合约
 │                              │                              │
 │ (1) approve(dex, 1e18)       │                              │
 ├─────────────────────────────→├─────────────────────────────→│
 │                              │                              │ 记录 allowance
 │ (2) tokenToEth(1e18)         │                              │
 │   msg.value = 0              │                              │
 ├─────────────────────────────→│                              │
 │                              │ (3) snapshot                 │
 │                              │   xReserves = token.balance  │
 │                              │   yReserves = ETH.balance    │
 │                              │ (4) 计算 ethOutput           │
 │                              │ (5) transferFrom(user, dex)  │
 │                              ├─────────────────────────────→│
 │                              │ (6) payable(user).transfer   │
 │                              │ (7) emit TokenToEthSwap      │
 │ (8) 收到 ETH                 │                              │
 │←─────────────────────────────┤                              │
```

### 4. UI 实测：swap 后的状态

![swap 后的 DEX 状态](/images/speedrunethereum/04-dex-06-dex-after-swap.png)

---

## 🏦 Checkpoint 5: 加撤流动性

### 目标

实现 `deposit()`（按比例加流动性）和 `withdraw()`（按比例撤流动性）。

### 1. 完整实现

```solidity
function deposit() public payable returns (uint256 tokensDeposited) {
    if (msg.value == 0) revert InvalidEthAmount();
    uint256 ethReserve = address(this).balance - msg.value;
    uint256 tokenReserve = token.balanceOf(address(this));
    uint256 liquidityMinted = msg.value * totalLiquidity / ethReserve;
    tokensDeposited = msg.value * tokenReserve / ethReserve;
    liquidity[msg.sender] += liquidityMinted;
    totalLiquidity += liquidityMinted;
    if (!token.transferFrom(msg.sender, address(this), tokensDeposited)) revert TokenTransferFailed();
    emit LiquidityProvided(msg.sender, liquidityMinted, msg.value, tokensDeposited);
}

function withdraw(uint256 amount) public returns (uint256 ethAmount, uint256 tokenAmount) {
    if (liquidity[msg.sender] < amount) revert InsufficientLiquidity(liquidity[msg.sender], amount);
    uint256 ethReserve = address(this).balance;
    uint256 tokenReserve = token.balanceOf(address(this));
    ethAmount = amount * ethReserve / totalLiquidity;
    tokenAmount = amount * tokenReserve / totalLiquidity;
    liquidity[msg.sender] -= amount;
    totalLiquidity -= amount;
    payable(msg.sender).transfer(ethAmount);
    if (!token.transfer(msg.sender, tokenAmount)) revert TokenTransferFailed();
    emit LiquidityRemoved(msg.sender, amount, ethAmount, tokenAmount);
}
```

### 2. 核心数学：LP 凭证 = 池子股份

#### 池子 = 股份公司

| 概念 | 现实类比 | 区块链版本 |
|------|---------|----------|
| 公司 | 池子（DEX 合约）| 池子（DEX 合约）|
| 股份 | LP 凭证 | `liquidity[user]` |
| 总股本 | 总股份 | `totalLiquidity` |
| 资产 | 公司的钱 | 池子里的 ETH + token |
| 你的份额 | 你的股份 / 总股本 | `liquidity[user] / totalLiquidity` |

#### 加流动性 = 买股份

```
投 Δx ETH 进去
池子要"等比"配 token（维持当前 ETH:token 比例）
你拿到 LP 凭证 = 你的池子"股份"
```

**关键公式**：

| 算什么 | 公式 |
|--------|------|
| 我投的 ETH 占池子比例 | `msg.value / ethReserve` |
| 我要同步投的 token | `msg.value × tokenReserve / ethReserve` |
| 我拿到的 LP 凭证 | `msg.value × totalLiquidity / ethReserve` |

**手算示例**（池子 5 ETH + 5 token，user2 投 5 ETH）：

| 变量 | 公式 | 结果 |
|------|------|------|
| `liquidityMinted` | `5 × 5 / 5` | **5 LP** |
| `tokensDeposited` | `5 × 5 / 5` | **5 token** |

#### 撤流动性 = 卖股份

```
我烧 amount LP
池子按"我的股份比例" 给我 ETH + token
```

**关键公式**：

| 算什么 | 公式 |
|--------|------|
| 我占池子比例 | `amount / totalLiquidity` |
| 我能拿回的 ETH | `amount × ethReserve / totalLiquidity` |
| 我能拿回的 token | `amount × tokenReserve / totalLiquidity` |

### 3. 跟 init() 的关键区别

| 维度 | `init` | `deposit` |
|------|--------|-----------|
| 谁用 | **第一个** LP | **第二个及以后** |
| LP 怎么算 | `totalLiquidity = address(this).balance` | `msg.value × totalLiquidity / ethReserve` |
| 要投多少 token | 用户自己定（必须 1:1 锚定）| 按比例自动算 |
| 为什么不同 | 没有"已有比例"可参考 | 按当前池子比例自动配平 |

**形象比喻**：
- `init` = 创业合伙人"出 100 万，给我 50% 股份"
- `deposit` = 投资人"我要买 30% 股份，需要多少钱？按当前估值"

### 4. Withdraw 为什么要先 Effects 再 Interactions？

```solidity
function withdraw(uint256 amount) public returns (uint256 ethAmount, uint256 tokenAmount) {
    if (liquidity[msg.sender] < amount) revert InsufficientLiquidity(liquidity[msg.sender], amount);

    // ② Effects 先：state 变量先改
    liquidity[msg.sender] -= amount;     // ← 先减
    totalLiquidity -= amount;            // ← 先减

    // ③ Interactions 后：再付钱
    payable(msg.sender).transfer(ethAmount);
    if (!token.transfer(msg.sender, tokenAmount)) revert TokenTransferFailed();
    emit LiquidityRemoved(msg.sender, amount, ethAmount, tokenAmount);
}
```

**为什么这样？** 如果先转 ETH 再改 state，**用户合约的 fallback 可以重入 withdraw**——重入时 `liquidity[msg.sender]` 还是旧的（没减），攻击者可以再撤一次，最终亏空整个池子。

CEI 模式让重入时看到的是"已经减过"的 state，**重入也无利可图**。

### 5. UI 实测：完整往返

#### Deposit 后

![deposit 后的状态](/images/speedrunethereum/04-dex-08-after-deposit.png)

- DEX ETH 余额：1.0000 → **1.5000 ETH**
- `totalLiquidity`：1e18 → **1.5e18**
- `getLiquidity(我的地址)`：1e18 → **1.5e18**
- 我的 Balloons：999 → **998.5**（被自动扣了 0.5 token 配对）

**对账**：投 0.5 ETH，池子原 1 ETH + 1 token，我占 50%，所以**复制一半池子** → 0.5 ETH + 0.5 token，拿 50% 的 LP（从 1 增到 1.5）。

#### Withdraw 后

![withdraw 后的状态](/images/speedrunethereum/04-dex-09-after-withdraw.png)

- 我的 Balloons 余额：998.5 → **1000**（拿回 1.5 token）
- DEX ETH 余额：1.5 → **0**（拿回 1.5 ETH）
- `totalLiquidity`：1.5e18 → **0**（全部 LP 烧掉）
- 我的 ETH：9999.5 → **10001**（多了 1.5 ETH）

**完美对账**：净投入 0，净收益 0。LP 凭证是"按比例分池子资产"的凭证，**烧掉就等于从池子退出**。

---

## 📊 测试结果

```bash
$ forge test --match-test Checkpoint -vv
```

```
[PASS] test_Checkpoint2_GetLiquidityReturnsLPBalance()          (gas: 180124)
[PASS] test_Checkpoint2_InitRevertsOnSecondCall()               (gas: 132464)
[PASS] test_Checkpoint2_TotalLiquidityStartsAtZeroAndInitSetsIt (gas: 124822)
[PASS] test_Checkpoint3_PriceCalculationWithFee()               (gas: 7542)
[PASS] test_Checkpoint4_EthToTokenEmitsAndTransfers()           (gas: 204130)
[PASS] test_Checkpoint4_EthToTokenRevertsOnZeroEth()            (gas: 180560)
[PASS] test_Checkpoint4_TokenToEthEmitsAndTransfers()           (gas: 184193)
[PASS] test_Checkpoint4_TokenToEthRevertsOnZeroTokens()         (gas: 180604)
[PASS] test_Checkpoint5_DepositIncreasesLiquidityAndEmits()     (gas: 252177)
[PASS] test_Checkpoint5_DepositRevertsOnZeroEth()               (gas: 180514)
[PASS] test_Checkpoint5_WithdrawEmitsAndDecreasesLiquidity()    (gas: 201812)
[PASS] test_Checkpoint5_WithdrawRevertsIfNoLiquidity()          (gas: 183690)

Suite result: ok. 12 passed; 0 failed; 0 skipped
```

---

## 🐛 关键踩坑清单

### 1. `0xfb8f41b2 not found on ABI`（OOPs 错误）

**表象**：Debug 调 `init` 失败，前端报 `0xfb8f41b2 not found on ABI`
**真相**：OpenZeppelin v5 标准错误 `ERC20InsufficientAllowance`（来自 Balloons 合约）
**原因**：没给 Balloons 授权 DEX
**修法**：先 `balloons.approve(dex, 1e18)`，再调 `init`
**诊断命令**：`cast sig "ERC20InsufficientAllowance(address,uint256,uint256)"` → `0xfb8f41b2`

### 2. `price()` Debug 返回 0

**表象**：Debug 调 `price(1e18, 5e18, 5e18)` 返回 0
**真相**：链上合约是**旧版本**（`price` 函数体是空注释）
**原因**：改完合约没重新部署
**修法**：`yarn deploy --reset` + 刷前端
**教训**：`forge test` 跑的是新代码，前端连的是链上旧合约——**两个东西完全不同**

### 3. `if (!token.transferFrom(...))` 是死代码

**表象**：写了 revert 但永远走不到
**真相**：OpenZeppelin v5 的 `transferFrom` 不会返回 false，失败直接 revert
**修法**：本关实现保留返回值检查；生产代码统一使用 `SafeERC20.safeTransferFrom`

### 4. `ethToToken` 没减 `msg.value`

**表象**：直接写 `address(this).balance` 作为 xReserves
**后果**：price 算错（用"包含 msg.value"的旧储备算 swap）
**真相**：payable 函数一进来 msg.value 已经在 balance 里
**修法**：用 `address(this).balance - msg.value`

### 5. `withdraw` 没先改 state 就转钱

**表象**：打开重入攻击面
**修法**：CEI 模式 —— Checks → Effects → Interactions

### 6. 整数除法精度损失

**表象**：`5e18 * 3 / 7e18` 应该是 2.14...，Solidity 算出来是 2（向下取整）
**后果**：用户**少拿** 0.000... 个 wei 的 LP
**真相**：Solidity 整数除法**永远向下取整**
**修法**：无解——这是 EVM 设计，Uniswap V2 也这样
**影响**：剩余的 wei 留在池子里归现有 LP 按比例分（隐式捐赠）

---

## 🎯 关键学习总结

### Solidity 基础

| 概念 | 一句话 |
|------|-------|
| `immutable` | 部署时确定的常量，存合约引用 |
| `payable` | 函数能收 ETH |
| `msg.value` | 当前调用附带的 ETH（**已经在 balance 里了**）|
| `address(this).balance` | 合约历史累计的 ETH 余额 |
| `pure` vs `view` | pure 不读 storage，view 读但不写 |

### ERC20

| 概念 | 一句话 |
|------|-------|
| **账本模型** | 合约是数据库，不是装币的容器 |
| **approve** | 用户授权别人能拉我多少钱（不改余额）|
| **transferFrom** | 别人用 allowance 把我的钱拉走 |
| **OZ v5 行为** | 失败直接 revert（不返回 false）|

### AMM 数学

| 公式 | 含义 |
|------|------|
| `x · y = k` | 恒定乘积 |
| `yOutput = y × Δx × 997 / (x × 1000 + Δx × 997)` | 带手续费的 swap 输出 |
| `liquidityMinted = Δx × totalLP / ethReserve` | 加流动性发多少 LP |
| `ethWithdrawn = amount × ethReserve / totalLP` | 撤流动性拿回多少 ETH |

### DeFi 模式

| 模式 | 一句话 |
|------|-------|
| **CEI** | Checks → Effects → Interactions（防重入）|
| **Push** | 合约主动给用户钱（transfer）|
| **Pull** | 合约主动拉用户钱（transferFrom + 需 approve）|
| **Snapshot** | 用"调用前"的状态算账（避免被自己改的状态坑）|

### 工程实践

| 习惯 | 原因 |
|------|------|
| 改完合约必跑 `forge build` | 验证语法 |
| 然后 `forge test` | 验证逻辑 |
| 然后 `yarn deploy --reset` | 让链上字节码更新 |
| 最后刷前端 | 让前端 ABI 重新加载 |

### Debug 实战

| 技巧 | 用途 |
|------|------|
| `cast sig "ErrorName(types)"` | 把错误名转成 4 字节选择器 |
| `forge test -vvv` | 看每次 swap 的事件、gas、状态 |
| 前端 ABI 找不到错误 | 怀疑**子调用**（不是入口合约）|
| 价格返回 0 / 旧值 | 链上合约是**旧版本**——重部署 |

---

## 📚 延伸阅读

- [Uniswap V2 白皮书](https://uniswap.org/whitepaper.pdf) —— 这整个挑战的"原本"
- [OpenZeppelin ERC20 文档](https://docs.openzeppelin.com/contracts/erc20) —— approve / transferFrom 流程
- [Solidity 0.8.x 安全模式](https://docs.soliditylang.org/en/v0.8.20/security-considerations.html) —— CEI、reentrancy
- [EIP-1967](https://eips.ethereum.org/EIPS/eip-1967) —— Proxy Storage Slots（理解为什么 init 是函数不是 constructor）

---

## 🏆 成果

- ✅ 12/12 forge 测试通过
- ✅ Debug 标签页 UI 实测 4 个 swap 场景 + deposit/withdraw 全部对账
- ✅ 完整理解 AMM 数学、ERC20 机制、Solidity 工程实践
- ✅ 学会了 Debug 实战（ABI 错误诊断、bytecode 过期）

**最大的认知升级**："合约不是装币的容器，是记币归属的账本"——这个反直觉点理解了，DeFi 80% 的概念就通了。
