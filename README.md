# autopub — 公众号发布工具

Obsidian 笔记 → Claude Code → 微信草稿箱

## 快速开始

### 1. 安装

克隆到本地：
```bash
git clone https://github.com/Bearshineliu/autopub-skill.git
cd autopub-skill
```

或下载 ZIP 包

### 2. 配置飞书账号

打开 https://my.feishu.cn/sheets/YkBsspUJ9hKLKgtkJVOcVfXwn6f

在表格中添加账号：
- 名称
- AppID（wx开头）
- AppSecret
- 模板（ganhuo/zixun/gushi/qingdan/shendu）
- mediaId（封面图ID，可先留空）

### 3. 启动代理

```bash
node local-proxy.js
```

### 4. 使用

把笔记内容粘贴给 Claude Code，说「发布」即可。

## 文件说明

| 文件 | 说明 |
|------|------|
| clipboard-publish.js | 发布到微信草稿箱 |
| upload-thumb.js | 上传封面图到微信永久素材 |
| local-proxy.js | 飞书账号配置代理 |
| autopub-server.js | 网页版服务 |
| start.bat | Windows 一键启动 |

## 安全说明

- AppID/AppSecret 存储在飞书表格，不在代码中
- API 配置通过本地代理读取，不暴露在代码里
