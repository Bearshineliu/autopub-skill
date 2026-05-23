# autopub — 公众号发布工具

Obsidian 笔记 → Claude Code → 微信草稿箱

## 功能

将 Markdown 内容通过微信 API 推送到公众号草稿箱，支持多账号管理。

## 安装（任意电脑）

```bash
git clone https://github.com/Bearshineliu/autopub-skill.git
cd autopub-skill
```

## 配置飞书账号

1. 打开 https://my.feishu.cn/sheets/YkBsspUJ9hKLKgtkJVOcVfXwn6f
2. 在表格中添加账号（列顺序固定）：
   | 名称 | AppID | AppSecret | 模板 | MediaId |
   |------|-------|-----------|------|---------|
   | 我的账号 | wx... | ... | ganhuo | |

3. 如果需要封面图，运行：
   ```bash
   node upload-thumb.js
   ```

## 启动

```bash
node local-proxy.js
```

保持运行，不要关闭。

## 使用

在 Claude Code 中：
1. 把笔记内容粘贴进来
2. 说「发布」或「用 gushi 模板发布」

Claude Code 会自动：
1. 从 `http://localhost:7788/accounts` 读取飞书账号
2. 调用 `clipboard-publish.js` 生成 HTML
3. 获取 Access Token
4. 推送到微信草稿箱

## 命令行模式

```bash
node clipboard-publish.js "内容" --template gushi --title "标题"
```

## 文件说明

| 文件 | 说明 |
|------|------|
| clipboard-publish.js | 发布脚本，核心逻辑 |
| local-proxy.js | 飞书账号配置代理（必须运行） |
| upload-thumb.js | 上传封面图到微信永久素材 |
| start.bat | Windows 一键启动 |
| SKILL.md | Claude Code Skill 定义文件 |

## AI 接入说明（给其他 AI/Claude Code 看）

当用户说「发布」时：
1. 确保 `local-proxy.js` 在运行（端口 7788）
2. 用户粘贴的内容作为发布内容
3. 调用 `node clipboard-publish.js "{内容}" --template {模板}`
4. 返回发布结果（成功显示 media_id）

## 安全说明

- AppID/AppSecret 存储在飞书表格，不在代码中
- MediaId 只需上传一次，之后自动复用
- Token 自动刷新，无需手动管理