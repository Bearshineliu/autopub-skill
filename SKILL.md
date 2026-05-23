---
name: autopub
version: 1.0.0
description: "公众号发布台：Obsidian笔记 → MD转HTML → 微信草稿箱。读取飞书表格账号配置自动推送。当用户说「发布」「推送到草稿」「公众号发布」时触发。"
---

# autopub — 公众号发布台

## 流程

```
Obsidian 写笔记 → 复制内容 → Claude Code 说「发布」
↓
读取飞书账号配置 → MD转HTML → 推送微信草稿箱
```

## 触发方式

- 直接粘贴内容说「发布」
- 说「用 gushi 模板发布」
- 说「推送到公众号草稿」

## 使用条件

1. **启动飞书代理**（后台运行）
   ```
   node C:/Users/Bear/.claude/projects/C--Windows-system32/local-proxy.js
   ```

2. **飞书表格配置**（账号/AppID/AppSecret/模板/mediaId）
   - 表格：https://my.feishu.cn/sheets/YkBsspUJ9hKLKgtkJVOcVfXwn6f

## 模板

| 参数 | 颜色 | 说明 |
|------|------|------|
| ganhuo | #35b378 绿 | 干货分享 |
| zixun | #e74c3c 红 | 资讯速递 |
| gushi | #5c9dff 蓝 | 故事叙事 |
| qingdan | #9b59b6 紫 | 清单整理 |
| shendu | #34495e 深蓝 | 深度长文 |

## 示例

```
发布这个内容，用 gushi 模板：
期中考完最后一科，聪明人都在做这件事
```

## 文件

- `clipboard-publish.js` — 发布脚本
- `upload-thumb.js` — 封面上传（如需更换封面）
