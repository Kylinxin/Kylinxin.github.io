---
title: "SpeedRunEthereum 靶场学习笔记 01：Tokenization"
date: 2026-06-21 09:00:00
updated: 2026-06-21 09:00:00
categories:
  - "区块链开发"
  - "SpeedRunEthereum"
tags:
  - "SpeedRunEthereum"
  - "Solidity"
  - "ERC-721"
  - "Scaffold-ETH 2"
  - "NFT"
abbrlink: "speedrunethereum-tokenization"
---
> 这是我的 SpeedRunEthereum 靶场个人学习笔记。第一关 Tokenization 聚焦 NFT 全栈开发：合约编写、测试、本地交互、Sepolia 部署、Etherscan 验证、Vercel 上线，以及最终提交通关。

- 关卡：Tokenization
- 完成日期：2026/06/21
- 状态：✅ ACCEPTED（+10 XP）
- Ethereum 101 进度：1/4

## 本关目标

构建一个可以铸造和转移 NFT 的 dApp，并把它部署到公开测试网和线上前端。

最终交付物包括：

1. ERC-721 合约 `YourCollectible`。
2. 可铸造、展示、转账 NFT 的 Next.js 前端。
3. 部署到 Sepolia 的合约。
4. Etherscan 合约源码验证。
5. 部署到 Vercel 的线上 dApp。
6. 在 SpeedRunEthereum 提交并通过验证。

## 挑战完成记录

| 类别 | 内容 |
| --- | --- |
| 部署钱包 | `0x6d1cd1d9f7226de5af18a7f9fd64e3aa6e81ca04` |
| 用户钱包 | `0x7FB24f7c6BE7fE61dA353E2A0fEf38b310aE71f7` |
| Sepolia 合约 | `0x2A4CDe1F94421E1230F71c9245A5ef237893521C` |
| Etherscan | https://sepolia.etherscan.io/address/0x2A4CDe1F94421E1230F71c9245A5ef237893521C |
| Vercel 前端 | https://tokenization-ky.vercel.app |
| 区块号 | `11113078` |
| 部署成本 | 约 `0.0092 ETH` |

## 专题一：Tokenization 与 ERC-721

Tokenization 的核心是把某种所有权表达为链上资产。NFT 不只是图片，它更重要的意义在于标准化的链上唯一所有权。

ERC-721 和 ERC-20 的关键区别：

| 标准 | 特性 | 例子 |
| --- | --- | --- |
| ERC-20 | 同质化，每个 token 等价 | USDT、USDC、DAI |
| ERC-721 | 非同质化，每个 token 独一无二 | NFT、ENS、Uniswap V3 LP 仓位 |

ERC-721 的基础接口包括：

```solidity
function ownerOf(uint256 tokenId) external view returns (address);
function balanceOf(address owner) external view returns (uint256);
function tokenURI(uint256 tokenId) external view returns (string memory);

function transferFrom(address from, address to, uint256 tokenId) external payable;
function safeTransferFrom(address from, address to, uint256 tokenId) external payable;

function approve(address to, uint256 tokenId) external payable;
function setApprovalForAll(address operator, bool approved) external;

event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
```

这一关使用 OpenZeppelin 的三件套：

| 合约 | 作用 |
| --- | --- |
| `ERC721` | 基础 ERC-721 实现：铸造、销毁、转移、授权 |
| `ERC721Enumerable` | 支持枚举一个地址持有的所有 tokenId |
| `ERC721URIStorage` | 支持每个 token 单独设置 tokenURI |

其中 `Enumerable` 解决“如何列出我的所有 NFT”，`URIStorage` 解决“每个 NFT 如何对应自己的 metadata”。

## 专题二：YourCollectible 合约实现

核心合约如下：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract YourCollectible is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    string private _baseTokenURI = "https://ipfs.io/ipfs/";

    constructor() ERC721("YourCollectible", "YCB") Ownable(msg.sender) {}

    function mintItem(address to, string memory uri) public {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

关键点：

1. `_nextTokenId++` 用计数器生成唯一 tokenId。
2. `_mint(to, tokenId)` 完成铸造，并触发 `Transfer(address(0), to, tokenId)`。
3. `_setTokenURI(tokenId, uri)` 把 metadata URI 绑定到 tokenId。
4. `mintItem` 是 `public`，没有 `onlyOwner`，所以任何人都能铸造。这是挑战设计的一部分，用于展示 ERC-721 的开放铸造流程。

## 专题三：OpenZeppelin v5 的钻石继承问题

第一次编译时遇到的核心错误是：

```text
Error: Derived contract must override function _update.
Two or more base classes define function with same name and parameter types.

Error: Derived contract must override function _increaseBalance.
Error: Derived contract must override function tokenURI.
Error: Derived contract must override function supportsInterface.
```

原因是 `YourCollectible` 同时继承了多个 ERC-721 扩展，而这些父合约都重写了同一批函数。

```text
            ERC721
           /      \
ERC721Enumerable  ERC721URIStorage
           \      /
       YourCollectible
```

Solidity 无法自动判断该使用哪一个父类实现，所以子合约必须显式重写冲突函数，并在 `override(...)` 中列出相关父类。

四个必须处理的函数：

| 函数 | 作用 |
| --- | --- |
| `_update` | mint、burn、transfer 的核心状态更新 |
| `_increaseBalance` | 账户 NFT 数量更新，Enumerable 也依赖它维护索引 |
| `tokenURI` | 决定 metadata URI 的读取逻辑 |
| `supportsInterface` | ERC-165 接口支持声明 |

正确写法的原则是：

```solidity
function foo(...) public override(A, B, C) {
    super.foo(...);
}
```

`override(...)` 表示“这个冲突由当前合约统一接住”，`super` 表示“继续沿 Solidity 的 C3 线性化顺序调用父类逻辑”。不要自己重写一套父类状态更新逻辑，否则很容易破坏 Enumerable 的索引一致性。

## 专题四：Scaffold-ETH 2 前端结构

这一关基于 Scaffold-ETH 2。前端核心目录：

```text
packages/nextjs/
├── app/
│   ├── myNFTs/                    # 铸造 NFT + 我的收藏
│   ├── transfers/page.tsx         # Transfer 事件列表
│   ├── ipfsUpload/page.tsx        # 上传图片到 IPFS
│   ├── ipfsDownload/page.tsx      # 从 IPFS 读取
│   └── api/ipfs/                  # IPFS pinning API 路由
├── components/
├── hooks/scaffold-eth/
├── services/web3/wagmiConfig.tsx
├── utils/tokenization/
│   ├── nftsMetadata.ts
│   ├── ipfs.ts
│   └── ipfs-fetch.ts
├── contracts/deployedContracts.ts
└── scaffold.config.ts
```

几个容易踩错的 hook 名称：

| 旧写法 | 当前写法 |
| --- | --- |
| `useScaffoldContractRead` | `useScaffoldReadContract` |
| `useScaffoldContractWrite` | `useScaffoldWriteContract` |
| `useDeployedContractInfo` | `useScaffoldContract` |

读合约：

```tsx
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const { data: tokenIdCounter } = useScaffoldReadContract({
  contractName: "YourCollectible",
  functionName: "tokenIdCounter",
});
```

写合约：

```tsx
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const { writeContractAsync, isMining } = useScaffoldWriteContract("YourCollectible");

await writeContractAsync({
  functionName: "mintItem",
  args: [address, ipfsUri],
});
```

监听事件：

```tsx
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const { data: transferEvents } = useScaffoldEventHistory({
  contractName: "YourCollectible",
  eventName: "Transfer",
  fromBlock: 0n,
  watch: true,
});
```

## 专题五：RainbowKit SSR 问题

本地打开 Next.js 前端时曾遇到 500：

```text
TypeError: localStorage.getItem is not a function
    at getWalletConnectConnector (rainbowkit/dist/index.js)
```

根因是 RainbowKit 初始化时读取 `localStorage`，但 Next.js App Router 默认会先做 SSR，服务端环境没有 `localStorage`。

失败方案是只在 Provider 内部用 `mounted` 判断，因为 `RainbowKitProvider` 自身初始化时已经访问了 `localStorage`。

正确方案是把整个 Provider 树改成客户端动态加载：

```tsx
// components/ClientProviders.tsx
"use client";

import dynamic from "next/dynamic";

const ScaffoldEthAppWithProviders = dynamic(
  () => import("~~/components/ScaffoldEthAppWithProviders").then(m => m.ScaffoldEthAppWithProviders),
  {
    ssr: false,
    loading: () => null,
  },
);

export const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>;
};
```

这样服务端不会执行 RainbowKit Provider，只有浏览器 hydrate 后才加载，`window` 和 `localStorage` 已经可用。

## 专题六：IPFS 与 NFT metadata 流程

NFT 图片和 metadata 不直接存链上。链上只保存 tokenId、owner、approval、tokenURI 等关键状态，图片和 JSON metadata 放在 IPFS。

```text
前端选择 NFT metadata
    ↓
POST /api/ipfs/add
    ↓
Pinata pinning
    ↓
返回 ipfs://Qm...
    ↓
mintItem(to, ipfsUri)
    ↓
链上记录 tokenURI
    ↓
Transfer 事件被前端读取并展示
```

这种设计的原因是链上存储非常贵。IPFS 的优势是内容寻址，`ipfs://Qm...` 本质上是内容哈希，只要有人继续 pin 这份文件，内容就可以被验证和读取。

## 专题七：部署到 Sepolia

常用命令：

```bash
yarn install
yarn chain
yarn deploy
yarn test
yarn generate
yarn deploy --network sepolia
```

`yarn deploy --network sepolia` 背后的链路大致是：

```text
yarn deploy
    ↓
node scripts-js/parseArgs.js
    ↓
make deploy network=sepolia
    ↓
forge script script/Deploy.s.sol --rpc-url <sepolia> --broadcast
```

部署成功记录：

```text
Deploying YourCollectible...
Deployed YourCollectible at 0x2A4CDe1F94421E1230F71c9245A5ef237893521C
Block: 11113078
Paid: ~0.0092 ETH
```

需要注意：`ETH_PASSWORD` 不应该直接写成字面密码。Foundry 语境下它通常被当作密码文件路径处理。安全做法是交互式输入密码，避免把密码写进 shell history、`.env` 或博客文章。

前端切到 Sepolia：

```ts
const scaffoldConfig = {
  targetNetworks: [chains.sepolia],
  pollingInterval: 3000,
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "默认 key",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "默认 ID",
  burnerWalletMode: "localNetworksOnly",
} as const satisfies ScaffoldConfig;
```

## 专题八：Etherscan 验证

验证命令：

```bash
yarn verify --network sepolia
```

验证流程：

1. 读取部署产物里的合约地址和字节码。
2. 使用相同 Solidity 版本、优化参数重新编译。
3. 向 Etherscan 提交源码和编译配置。
4. Etherscan 重新编译并匹配链上字节码。
5. 验证通过后显示 Contract Source Code Verified。

`.env` 中只应放本地私密配置，不应提交：

```env
ETHERSCAN_API_KEY=<your_etherscan_api_key>
```

验证后的合约页面：

https://sepolia.etherscan.io/address/0x2A4CDe1F94421E1230F71c9245A5ef237893521C

## 专题九：Vercel 部署

部署命令：

```bash
yarn vercel login
yarn vercel --prod
```

注意事项：

1. 在项目根目录执行，不要在 `packages/foundry` 或 `packages/nextjs` 子目录执行。
2. Vercel 项目名只能使用小写字母、数字和连字符，例如 `tokenization-ky`。
3. 环境变量命令依赖项目已经存在，通常先部署一次创建项目，再配置环境变量。

可配置的环境变量：

| 变量名 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Alchemy RPC key |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect 项目 ID |
| `PINATA_KEY` | Pinata key |
| `PINATA_SECRET` | Pinata secret |

线上地址：

https://tokenization-ky.vercel.app

## 专题十：踩坑复盘

### Diamond Problem 编译错误

OpenZeppelin v5 的 ERC-721 多扩展组合必须显式重写 `_update`、`_increaseBalance`、`tokenURI`、`supportsInterface`。修复时保留 `super` 调用链，不要手写父类状态逻辑。

### RainbowKit SSR 500

RainbowKit 依赖浏览器环境，Provider 树必须避免在服务端初始化。用 `dynamic(..., { ssr: false })` 包住整棵 Provider 树。

### Sepolia 交易 pending

部署交易曾出现长时间 pending。经验是不要盲目手动设置异常 gas price，优先使用 Foundry 自动估算，必要时检查 Etherscan 上的交易状态和 nonce。

### 部署钱包和浏览器钱包不是同一个

`yarn generate` 生成的是部署者 keystore，MetaMask 是浏览器交互钱包。二者地址、余额、权限完全独立。

### public mint 不等于 owner 权限

浏览器钱包能铸 NFT，不是因为它有 owner 权限，而是因为 `mintItem` 本身是 `public`，任何地址都能调用。当前合约继承了 `Ownable`，但没有在 `mintItem` 上使用 `onlyOwner`。

## 专题十一：安全与工程理解

### 钱包角色

| 角色 | 来源 | 用途 |
| --- | --- | --- |
| 部署钱包 | `yarn generate` keystore | 部署合约、可能持有 owner 权限 |
| 用户钱包 | MetaMask | 与 dApp 交互 |
| Burner wallet | Scaffold-ETH 本地生成 | 本地开发测试 |
| 硬件钱包 | Ledger / Trezor | 高价值资产和高权限账户 |

部署者账户如果持有合约 owner 权限，就应该按高权限账户处理。生产环境中常见做法是把 owner 转给多签钱包。

### 链上与链下边界

```text
链上：tokenId、ownerOf、approval、Transfer events
链下：metadata JSON、图片文件、索引、搜索、部分解析服务
```

把大对象放链下，把所有权和可验证指针放链上，是 NFT 的常见工程折中。

### ERC-721 接收钩子

`safeTransferFrom` 在接收方是合约时，会要求对方实现 `onERC721Received` 并返回指定 selector。这样可以避免 NFT 被转进不支持 ERC-721 的合约后永久卡住。

```solidity
function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
) external returns (bytes4);
```

## 完整流程速查

```text
本地链启动
  yarn chain
      ↓
本地部署和测试
  yarn deploy
  yarn test
      ↓
部署到 Sepolia
  yarn deploy --network sepolia
      ↓
Etherscan 验证
  yarn verify --network sepolia
      ↓
前端生产部署
  yarn vercel --prod
      ↓
SpeedRunEthereum 提交
  ACCEPTED
```

## 常用命令

```bash
# 开发
yarn chain
yarn deploy
yarn start
yarn test
yarn lint
yarn format

# 部署
yarn generate
yarn deploy --network sepolia
yarn verify --network sepolia
yarn account

# 前端部署
yarn vercel login
yarn vercel --prod

# Foundry
forge build
forge test -vv
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
cast call <addr> "tokenIdCounter()(uint256)" --rpc-url sepolia
cast send <addr> "mintItem(address,string)" <to> "<ipfs://...>" --rpc-url sepolia
anvil
```

## 本关收获

这一关不是只完成了一个 NFT demo，而是串起了 Solidity、OpenZeppelin、Foundry、Scaffold-ETH 2、IPFS、Sepolia、Etherscan、Vercel 的完整链路。

真正沉淀下来的能力：

1. ERC-721 标准和 OpenZeppelin 组合使用。
2. Solidity 多重继承和 `override` / `super` 机制。
3. Foundry 编译、测试、部署、链上读写。
4. Sepolia 测试网部署和 gas / nonce 调试。
5. Etherscan 合约验证流程。
6. Next.js + Wagmi + RainbowKit 前端集成。
7. IPFS metadata 的链上链下边界。
8. 部署钱包、用户钱包、burner wallet 的角色区分。

## 下一关方向

后续 SpeedRunEthereum 可以继续按专题推进：

| 挑战 | 主题 | 难度 |
| --- | --- | --- |
| Crowdfunding | 合约之间的协作 | 入门 |
| Token Vendor | ETH 与 Token 兑换 | 入门 |
| Dice Game | 链上随机数与攻击防御 | 进阶 |
| Build a DEX | AMM 去中心化交易所 | 进阶 |
| Oracles | 预言机机制 | 高级 |
| Over-Collateralized Lending | 超额抵押借贷 | 高级 |

## 参考资料

- SpeedRunEthereum 官网：https://speedrunethereum.com/
- Tokenization 挑战：https://speedrunethereum.com/challenge/tokenization
- 我的 Builder 档案：https://speedrunethereum.com/builders/0x7FB24f7c6BE7fE61dA353E2A0fEf38b310aE71f7
- Scaffold-ETH 2 文档：https://docs.scaffoldeth.io/
- Foundry Book：https://book.getfoundry.sh/
- OpenZeppelin Contracts：https://docs.openzeppelin.com/contracts/
- Solidity 文档：https://docs.soliditylang.org/
