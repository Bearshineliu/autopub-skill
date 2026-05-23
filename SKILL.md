---
name: autopub
version: 1.0.0
description: "公众号发布台：读取飞书表格账号配置，将 Markdown 内容推送到微信草稿箱。当用户说「发布」「推送到草稿」「推送到公众号」时触发。"
---

# autopub — 公众号发布台

## 意图识别

当用户表达以下意图时使用本 skill：
- 「发布」
- 「推送到草稿」
- 「推送到公众号」
- 「发布到微信」
- 用户粘贴了笔记内容并要求发布

## 前置条件

**必须先运行 `local-proxy.js`**（飞书账号配置代理）：
```bash
node local-proxy.js
```

代理地址：`http://localhost:7788`

## 工作流程

```
用户粘贴内容 → Skill 读取飞书账号 → 调用 clipboard-publish.js → 推送微信草稿箱
```

### 步骤 1: 读取飞书账号配置

请求：
```
GET http://localhost:7788/accounts
```

返回格式：
```json
{
  "ok": true,
  "accounts": [{
    "name": "账号名称",
    "appid": "wx开头的AppID",
    "appsecret": "AppSecret",
    "template": "ganhuo|zixun|gushi|qingdan|shendu",
    "mediaId": "封面图media_id（永久素材ID）"
  }]
}
```

### 步骤 2: 获取 Access Token

```javascript
GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={appsecret}
```

### 步骤 3: 推送草稿

```javascript
POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token={token}
Content-Type: application/json

Body:
{
  "articles": [{
    "title": "文章标题（从内容第一行提取）",
    "author": "作者（可选）",
    "digest": "摘要（内容前54字）",
    "content": "<html>HTML内容</html>",
    "thumb_media_id": "封面图media_id（从飞书账号的mediaId字段获取，可为空）",
    "need_open_comment": 1,
    "only_fans_can_comment": 0
  }]
}
```

返回 `media_id` 即表示成功：
```json
{"media_id": "-ITQBuxAIk_WgW8hk3vQGMK...", "item": []}
```

## 触发方式

### 方式一：用户粘贴内容（主要方式）
```
用户粘贴 Markdown 笔记内容，说「发布」
Skill 自动调用 clipboard-publish.js
```

### 方式二：命令行
```bash
node clipboard-publish.js "内容" --template gushi --title "标题"
```

## 模板颜色

| 模板 | 颜色值 | 说明 |
|------|--------|------|
| ganhuo | #35b378 | 干货绿 |
| zixun | #e74c3c | 资讯红 |
| gushi | #5c9dff | 故事蓝 |
| qingdan | #9b59b6 | 清单紫 |
| shendu | #34495e | 深度深蓝 |

## 文件索引

| 文件 | 说明 |
|------|------|
| clipboard-publish.js | 发布脚本，核心逻辑（步骤123都在里面） |
| local-proxy.js | 飞书账号代理，读取账号配置 |
| upload-thumb.js | 封面上传（更换封面时用） |
| start.bat | Windows 一键启动代理 |

## 错误处理

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `invalid media_id` | mediaId 为空或无效 | 运行 `node upload-thumb.js` 上传封面 |
| `请先运行 local-proxy.js` | 代理未启动 | 先运行 `node local-proxy.js` |
| 账号读取失败 | 飞书表格格式不对 | 检查表格列顺序：名称/AppID/AppSecret/模板/mediaId |

## 安全说明

- AppID/AppSecret 存在飞书表格，不在代码中
- 每个账号的 mediaId 只需要上传一次，之后自动复用
- Token 自动获取，无需手动管理