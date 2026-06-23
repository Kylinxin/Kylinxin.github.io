---
title: "FortiToken Mobile AES/TOTP 逆向与复现"
date: 2025-06-23 11:00:00
updated: 2025-06-23 11:00:00
categories:
  - "逆向工程"
tags:
  - "Fortinet"
  - "FortiToken"
  - "TOTP"
  - "Android"
  - "MFA"
abbrlink: "fortitoken-mobile-aes-totp"
---

FortiToken Mobile 的 OTP 生成最终落在 OATH HOTP/TOTP 标准上，区别在于 seed 的注册、存储和设备绑定方式。逆向过程可以分成两条路线：一条从 activation code 进入移动端注册协议，另一条从已经激活的 Android 应用中还原本地 encrypted seed。

所有 seed、activation code、SSAID、UUID 和 serial 都属于 MFA 凭据材料，只应在自有设备或授权测试环境中处理。

## 1. 机制概览

Fortinet 将 FortiToken 描述为兼容 HOTP/TOTP 的 OATH token。移动端 seed 使用 AES-256-CBC 保存，派生密钥与设备唯一标识相关；激活完成后，OTP 可以离线生成。

这说明网络注册与本地 OTP 生成是两个阶段：注册阶段把 seed 安全下发到设备，本地阶段再用设备材料解开 seed 并计算 TOTP。

```text
注册阶段
activation code
  -> FortiToken provisioning service
  -> encrypted seed
  -> mobile-id 派生的 AES 解密
  -> raw seed

本地阶段
FortiToken.db + SharedPreferences + Android SSAID
  -> encrypted UUID
  -> encrypted seed
  -> 两阶段 SHA-256/AES-CBC
  -> hex seed
  -> Base32 secret
  -> TOTP
```

![Fortinet 第三方 TOTP 接入示例](/images/fortinet/fortitoken-totp/fig01_fortinet_third_party_totp_example.png)

![FortiToken Mobile 应用界面](/images/fortinet/fortitoken-totp/fig02_google_play_fortitoken_screenshot.png)

## 2. 路线 A：activation code 注册协议

这一条路线模拟 FortiToken Mobile 的首次注册流程。输入是 activation code，输出是 raw seed 及其十六进制、Base32 表示。

### 2.1 activation code 格式

常见 activation code 先按 Base32 解码为 10 字节：

```text
21 00 xx xx xx xx xx xx xx xx
|---| |-----------------------|
前缀          8 字节 token
```

前两个字节 `0x21 0x00` 可视为格式或版本前缀，注册请求使用后面的 8 字节 token。若输入本身就是 8 字节十六进制数据，则不再执行 Base32 解码和前缀剥离。

```python
import base64

def decode_activation_code(code: str) -> bytes:
    raw = base64.b32decode(code)
    if len(raw) != 10 or raw[:2] != b"\x21\x00":
        raise ValueError("unexpected activation code format")
    return raw[2:]
```

### 2.2 mobile-id 与注册请求

客户端生成并持久化一个 16 字符的 `mobile_id`。注册请求通过 FortiToken Mobile 使用的客户端证书建立 mTLS 会话，并提交如下逻辑字段：

```json
{
  "mobile_id": "<16-character mobile id>",
  "__type": "SoftToken.MobileProvisionRequest",
  "token_activation_code": "<8-byte token encoded as hex>"
}
```

`mobile_id` 不是一次性随机数。首次注册后它与 token 绑定，后续重复注册仍需使用同一值。把它每次重新生成会导致同一个 activation code 无法按原关系恢复。

### 2.3 provisioning 响应中的 seed

服务端响应包含加密 seed。公开实现中的解密参数为：

```text
key = UTF8(mobile_id)       # 16 bytes
iv  = UTF8("fortitokenmobile")
cipher = AES-CBC
plaintext = ASCII hex seed + trailing bytes
raw seed = hex_to_bytes(plaintext[0:40])
```

前 40 个 ASCII 字符表示 20 字节 seed。关键处理可写成：

```python
import base64
from Crypto.Cipher import AES

def decrypt_provisioned_seed(encrypted_seed: str, mobile_id: str) -> bytes:
    if len(mobile_id.encode("utf-8")) != 16:
        raise ValueError("mobile_id must encode to 16 bytes")

    ciphertext = base64.b64decode(encrypted_seed)
    cipher = AES.new(
        mobile_id.encode("utf-8"),
        AES.MODE_CBC,
        b"fortitokenmobile",
    )
    seed_hex = cipher.decrypt(ciphertext)[:40].decode("ascii")
    return bytes.fromhex(seed_hex)
```

这条路线的限制是 activation code 通常只能完成一次首次注册。复现实验应提前保存 `mobile_id`，并使用专用测试 token，避免影响已有移动端绑定。

![registration flow 的 raw seed 与 Base32 输出](/images/fortinet/fortitoken-totp/fig06_ss23_registration_output_redacted.png)

### 2.4 `register-token.py` 安装与用法

脚本需要 Python 3、`requests-pkcs12`、`requests` 和 `pycryptodome`。仓库已经提供固定版本的 `requirements.txt` 与客户端证书文件，运行时应保持二者和脚本位于同一目录。

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

Base32 activation code 作为位置参数传入：

```bash
python3 register-token.py "$TOKEN_CODE" --mobile-id "$MOBILE_ID"
```

如果手中是去掉两字节前缀后的 8 字节十六进制 token，增加 `--raw-token`：

```bash
python3 register-token.py "$RAW_TOKEN_HEX" \
  --raw-token \
  --mobile-id "$MOBILE_ID"
```

参数关系如下：

| 参数 | 含义 |
| --- | --- |
| `token` | Base32 activation code；配合 `--raw-token` 时改为 8 字节 hex |
| `-m`, `--mobile-id` | 16 字符设备标识，需与 token 的注册关系保持一致 |
| `-r`, `--raw-token` | 跳过 Base32 与 `0x21 0x00` 前缀处理，直接读取 hex token |

省略 `--mobile-id` 时，脚本会生成 `uuid4().hex[:16]`，写入当前目录的 `config.txt`，以后继续读取该文件。

这个文件与 activation code、seed 一样需要妥善保存；删除后重新生成不同 ID，无法延续原注册关系。

### 2.5 函数调用链

```text
main
  -> parse_token / parse_raw_token
  -> get_mobile_id
  -> register_token
       -> requests.Session
       -> Pkcs12Adapter(ftm.ks)
       -> POST provisioning request
       -> decrypt_seed
  -> print hex seed / Base32 seed
```

`parse_token()` 执行 Base32 解码，检查前缀和 10 字节长度，然后返回后 8 字节。`parse_raw_token()` 执行 `bytes.fromhex()` 并检查 8 字节长度。

当前实现遇到长度或前缀异常时只打印提示，仍会继续注册；运行前应主动终止并检查输入，避免把错误 token 提交到服务端。

`register_token()` 使用 `ftm.ks` 创建 mTLS session，提交 `mobile_id`、消息类型和 activation token。HTTP 状态不是 200，或响应对象带有 `error` 字段时抛出异常。

成功响应中的 `seed` 交给 `decrypt_seed()`，再按第 2.3 节的 AES-CBC 参数恢复 20 字节 raw seed。

### 2.6 输出处理

成功时输出两种 seed 表示：

```text
Token registered: <hex seed> (base32: <Base32 seed>)
To generate a token now, run: oathtool --totp <hex seed>
```

十六进制值适合直接传给默认按 hex 读取 secret 的工具，Base32 值适合导入密码管理器或 TOTP 应用。输出行只完成 seed 转换，不会自动读取 `otp_period` 与 `digits`。

若该 token 使用 60 秒周期，应在 TOTP 工具中显式设置 60 秒，而不是沿用常见的 30 秒默认值。

脚本处理过程中最常见的异常如下：

| 现象 | 处理方向 |
| --- | --- |
| `Incorrect padding` | 检查 Base32 activation code 是否完整、大小写和尾部字符是否被截断 |
| token 长度提示 | 区分 10 字节带前缀格式与 8 字节 raw 格式 |
| HTTP 非 200 | 检查网络、系统时间、客户端证书文件和 provisioning 服务状态 |
| `Could not register token` | activation code 可能已绑定，或服务端拒绝当前 `mobile_id` |
| AES/hex 解码异常 | 检查 `mobile_id` 是否恰好编码为 16 字节，响应 seed 是否完整 |
| OTP 与移动端不同 | 设置正确的 period、digits，并同步设备时间 |

## 3. 路线 B：Android 本地数据

已经激活的 Android 应用不会直接保存明文 seed。需要把数据库、SharedPreferences 和 Android SSAID 中的材料组合起来，先恢复 UUID，再恢复 seed。

### 3.1 数据对象

| 字段 | 保存位置 | 作用 |
| --- | --- | --- |
| encrypted seed | `FortiToken.db` 的 `Account` 记录 | AES-CBC 密文形式的 TOTP seed |
| `otp_period` | `FortiToken.db` | TOTP 时间步长 |
| `digits` | `FortiToken.db` | OTP 位数 |
| encrypted UUID | SharedPreferences | 第二阶段派生所需的 UUID 密文 |
| serial / legacy serial | SharedPreferences | 参与 SHA-256 key derivation |
| Android SSAID | Android per-app setting | 设备绑定材料 |

![`FortiToken.db` 中的 Account 字段关系](/images/fortinet/fortitoken-totp/fig03_jon_db_fields_evidence.png)

![SharedPreferences、serial 与 Android SSAID 的关系](/images/fortinet/fortitoken-totp/fig04_jon_sharedprefs_ssaid_evidence.png)

`Account` 表中的 seed 与 `otp_period`、`digits` 必须取自同一条 token 记录。多 token 环境中如果串用了另一条记录的周期或位数，即使 seed 正确也会生成不同 OTP。

![openftm 使用 encrypted seed 与 SSAID 的关系](/images/fortinet/fortitoken-totp/fig07_openftm_readme_seed_ssaid_redacted.png)

## 4. 两阶段本地解密

本地解密先使用设备材料恢复 UUID，再把 UUID 加入第二阶段 key material。两个阶段均使用 SHA-256 生成 32 字节 AES key，以 16 字节 zero IV 执行 AES-CBC。

### 4.1 UUID

```text
uuid_key = SHA256(device_id || serial_suffix)

uuid_plaintext = AES-CBC-Decrypt(
    key = uuid_key,
    iv = 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00,
    ciphertext = Base64Decode(encrypted_uuid)
)

uuid = PKCS-unpad(uuid_plaintext)
```

`device_id` 对应 Android SSAID，`serial_suffix` 对应目标版本使用的 serial 或 legacy serial 字段。字符串拼接必须保持应用原有顺序和编码，任何多余分隔符都会改变 SHA-256 结果。

### 4.2 seed

```text
seed_key = SHA256(device_id || serial_suffix || uuid)

seed_plaintext = AES-CBC-Decrypt(
    key = seed_key,
    iv = 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00,
    ciphertext = Base64Decode(encrypted_seed)
)

seed_hex = PKCS-unpad(seed_plaintext)
secret_base32 = Base32(HexDecode(seed_hex))
```

Java 中常见的 `AES/CBC/PKCS5Padding` 用于 AES 时，实际填充行为与 16 字节 block 的 PKCS#7 相同。解密后必须先检查末字节给出的 padding 长度，再确认尾部所有 padding 字节一致。

```python
import base64
import hashlib
from Crypto.Cipher import AES

ZERO_IV = bytes(16)

def pkcs7_unpad(data: bytes) -> bytes:
    if not data:
        raise ValueError("empty plaintext")
    count = data[-1]
    if count < 1 or count > AES.block_size:
        raise ValueError("invalid PKCS padding")
    if data[-count:] != bytes([count]) * count:
        raise ValueError("invalid PKCS padding")
    return data[:-count]

def derive_key(*parts: str) -> bytes:
    material = "".join(parts).encode("utf-8")
    return hashlib.sha256(material).digest()

def decrypt_b64(ciphertext_b64: str, key: bytes) -> bytes:
    ciphertext = base64.b64decode(ciphertext_b64, validate=True)
    if len(ciphertext) % AES.block_size:
        raise ValueError("ciphertext is not block aligned")
    plaintext = AES.new(key, AES.MODE_CBC, ZERO_IV).decrypt(ciphertext)
    return pkcs7_unpad(plaintext)

def recover_local_seed(
    encrypted_uuid: str,
    encrypted_seed: str,
    device_id: str,
    serial_suffix: str,
) -> tuple[str, str]:
    uuid_key = derive_key(device_id, serial_suffix)
    uuid = decrypt_b64(encrypted_uuid, uuid_key).decode("utf-8")

    seed_key = derive_key(device_id, serial_suffix, uuid)
    seed_hex = decrypt_b64(encrypted_seed, seed_key).decode("ascii")
    seed_bytes = bytes.fromhex(seed_hex)
    secret = base64.b32encode(seed_bytes).decode("ascii").rstrip("=")
    return uuid, secret
```

![SHA-256、AES-CBC、zero IV 与 Base32 转换](/images/fortinet/fortitoken-totp/fig05_jon_aes_cbc_code_evidence.png)

## 5. TOTP 生成

恢复出的 Base32 secret 进入标准 RFC 4226 / RFC 6238 计算：

```text
T = floor((UnixTime - T0) / X)
HOTP(K, C) = DynamicTruncate(HMAC-SHA1(K, C)) mod 10^digits
TOTP(K, T) = HOTP(K, T)
```

FortiToken 的 `X` 和 `digits` 应从当前 `Account` 记录读取。公开实现通常使用 60 秒周期和 6 位 OTP，但不能用固定默认值覆盖数据库字段。

```python
import base64
import hashlib
import hmac
import struct
import time

def hotp(secret_base32: str, counter: int, digits: int) -> str:
    padding = "=" * ((8 - len(secret_base32) % 8) % 8)
    key = base64.b32decode(secret_base32 + padding)
    message = struct.pack(">Q", counter)
    digest = hmac.new(key, message, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(binary % (10 ** digits)).zfill(digits)

def totp(
    secret_base32: str,
    period: int,
    digits: int,
    timestamp: int | None = None,
) -> str:
    now = int(time.time()) if timestamp is None else timestamp
    return hotp(secret_base32, now // period, digits)
```

对照 FortiToken Mobile 与脚本输出时，两端必须使用同一时间戳窗口、period 和 digits。设备时钟偏差超过一个时间步会表现为 seed 错误，因此应先检查系统时间，再排查密钥派生。

## 6. 完整复现顺序

### 6.1 选择输入路径

- 未激活的专用测试 token 使用路线 A，并在注册前保存固定 `mobile_id`。
- 已激活的自有 Android token 使用路线 B，同时取得同一账号记录的数据库字段、SharedPreferences 字段和 SSAID。

两条路线最后都应得到相同类型的 20 字节 raw seed 或对应的 Base32 secret，但中间加密参数完全不同，不能混用 provisioning 阶段的 AES 参数和 Android 本地阶段的 AES 参数。

### 6.2 路线 A 数据流

1. Base32 解码 activation code，检查 10 字节长度与 `0x21 0x00` 前缀。
2. 取后 8 字节作为注册 token，并以十六进制放入 provisioning 请求。
3. 使用持久化的 16 字符 `mobile_id` 建立注册关系。
4. 从响应取出 encrypted seed。
5. 使用 `mobile_id` 作为 AES key、`fortitokenmobile` 作为 IV 解密。
6. 截取前 40 个 ASCII hex 字符并转换为 20 字节 raw seed。
7. 将 raw seed 编码为 Base32，结合目标周期和位数计算 TOTP。

### 6.3 路线 B 数据流

1. 从同一 `Account` 记录读取 encrypted seed、`otp_period` 和 `digits`。
2. 从对应 SharedPreferences 读取 encrypted UUID 与 serial 字段。
3. 取得该应用身份下的 Android SSAID。
4. 计算 `SHA256(SSAID || serial_suffix)`，以 zero IV 解开 UUID。
5. 计算 `SHA256(SSAID || serial_suffix || UUID)`，以 zero IV 解开 seed。
6. 去除 PKCS padding，将 ASCII hex seed 转为 bytes。
7. Base32 编码后，按数据库中的 period 和 digits 计算 TOTP。

### 6.4 常见偏差

| 现象 | 优先检查 |
| --- | --- |
| Base64 解码失败 | 字段是否包含引号、换行或截断 |
| ciphertext 非 16 字节对齐 | 取错字段、Base64 文本不完整 |
| PKCS padding 错误 | SSAID、serial 字段、拼接顺序或目标记录不匹配 |
| UUID 可读但 seed 无法解开 | UUID 字符串是否保留了多余换行，seed 是否来自同一账号 |
| Base32 可生成但 OTP 不一致 | `otp_period`、`digits`、设备时间与 seed 记录 |
| 路线 A 无法重复注册 | activation code 已绑定，或 `mobile_id` 与首次注册不同 |

## 7. 分析结论

FortiToken Mobile 的 TOTP 算法本身是标准 OATH TOTP，逆向难点集中在 seed 的生命周期。首次注册路线使用 activation code、mTLS 与 `mobile_id` 保护 provisioning 响应；Android 本地路线使用 SSAID、serial 和 UUID 组成两阶段设备绑定解密。

两条路线最终都把 raw seed 转成 Base32，再按记录中的 period 与 digits 生成 OTP。

## 延伸阅读

- [Fortinet: FortiToken considerations](https://docs.fortinet.com/document/fortitoken/latest/comprehensive-guide/721304/considerations)
- [Jonathan Stoler: Decrypting TOTP keys from FortiToken for Android](https://jonstoler.me/blog/extracting-fortitoken-mobile-totp-secret)
- [ss23: fortitoken-mobile-registration](https://github.com/ss23/fortitoken-mobile-registration)
- [ptrcnull: openftm](https://github.com/ptrcnull/openftm)
- [denngie: fortitoken-decrypt](https://github.com/denngie/fortitoken-decrypt)
- [RFC 4226: HOTP](https://www.rfc-editor.org/rfc/rfc4226)
- [RFC 6238: TOTP](https://www.rfc-editor.org/rfc/rfc6238)
