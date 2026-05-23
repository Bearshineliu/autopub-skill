/**
 * clipboard-publish.js
 * 从 Obsidian 复制内容，直接通过微信 API 推送到草稿箱
 *
 * 用法:
 *   node clipboard-publish.js "内容" --title "标题" --template gushi
 *   cat note.md | node clipboard-publish.js --template ganhuo
 */

const https = require('https');
const http = require('http');

// ============ 配置 ============
const CONFIG = {
  // 微信 API（可通过飞书账号配置覆盖）
  appid: process.env.WX_APPID || '',
  appsecret: process.env.WX_APPSECRET || '',
  // 本地代理（飞书账号配置）
  proxyUrl: 'http://localhost:7788',
  // 默认模板
  defaultTemplate: 'ganhuo',
  // 模板颜色配置
  templateColors: {
    ganhuo: '#35b378',
    zixun: '#e74c3c',
    gushi: '#5c9dff',
    qingdan: '#9b59b6',
    shendu: '#34495e'
  }
};
// ==============================

// 解析命令行参数
const args = process.argv.slice(2);
let content = '';
let title = '';
let template = CONFIG.defaultTemplate;
let author = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--template' || args[i] === '-t') {
    template = args[i + 1] || template;
    i++;
  } else if (args[i] === '--title' || args[i] === '-T') {
    title = args[i + 1] || title;
    i++;
  } else if (args[i] === '--author') {
    author = args[i + 1] || author;
    i++;
  } else if (!args[i].startsWith('--') && args[i].length > 0) {
    content = args[i];
  }
}

// 如果没有命令行内容，尝试从 stdin 读取
if (!content && !process.stdin.isTTY) {
  content = require('fs').readFileSync(0, 'utf8').trim();
}

if (!content) {
  console.log('❌ 请提供要发布的内容');
  console.log('');
  console.log('用法:');
  console.log('  node clipboard-publish.js "内容" --template gushi --title "标题"');
  console.log('  cat note.md | node clipboard-publish.js --template ganhuo');
  console.log('');
  console.log('环境变量:');
  console.log('  WX_APPID=wx... WX_APPSECRET=... node clipboard-publish.js "内容"');
  process.exit(1);
}

// 如果没有标题，从内容第一行提取
if (!title) {
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.startsWith('#')) {
    title = firstLine.replace(/^#+\s*/, '').trim();
  } else {
    title = firstLine.substring(0, 30);
  }
}

async function publish() {
  console.log('');
  console.log('📤 正在发布到公众号草稿箱...');
  console.log(`📋 模板: ${template}`);
  console.log(`📝 标题: ${title}`);
  console.log(`📏 字数: ${content.length}`);

  try {
    // 1. 转换 HTML
    const html = convertToHtml(content, template);
    console.log('✅ HTML 转换完成');

    // 2. 获取 Access Token
    let appid = CONFIG.appid;
    let appsecret = CONFIG.appsecret;
    let account = null;

    // 尝试从本地代理获取账号配置
    if (!appid || !appsecret) {
      console.log('🔍 尝试从飞书配置获取账号...');
      account = await getAccountFromProxy();
      if (account) {
        appid = account.appid;
        appsecret = account.appsecret;
        if (account.template) template = account.template;
        console.log(`✅ 已从飞书加载账号: ${account.name}`);
      }
    }

    if (!appid || !appsecret) {
      throw new Error('请设置 WX_APPID 和 WX_APPSECRET 环境变量，或通过飞书配置');
    }

    console.log('🔑 获取 Access Token...');
    const token = await getAccessToken(appid, appsecret);
    console.log('✅ Token 获取成功');

    // 3. 发布到草稿箱
    let thumbMediaId = '';
    if (account && account.mediaId) {
      thumbMediaId = account.mediaId;
      console.log('🖼️  使用固定封面 media_id:', thumbMediaId);
    } else {
      console.log('🖼️  无固定封面，跳过');
    }

    console.log('📤 推送到草稿箱...');
    const result = await addDraft(token, {
      title,
      author,
      content: html,
      digest: content.substring(0, 54) + '...',
      thumb_media_id: thumbMediaId
    });

    if (result.media_id) {
      console.log('');
      console.log('🎉 发布成功！');
      console.log('   media_id:', result.media_id);
      console.log('   请到公众号后台 https://mp.weixin.qq.com 查看草稿箱');
    } else {
      console.log('');
      console.log(`❌ 发布失败: ${result.errmsg} (${result.errcode})`);
    }

  } catch (err) {
    console.log('');
    console.log(`❌ 错误: ${err.message}`);
  }
}

// ============ 核心函数 ============

function convertToHtml(md, template) {
  const color = CONFIG.templateColors[template] || CONFIG.templateColors.ganhuo;

  let html = md
    // 移除 frontmatter
    .replace(/^---[\s\S]*?---\n?/, '')
    // h1 → h2（公众号限制）
    .replace(/^# (.+)$/gm, `<h2 style="color:${color};font-size:22px;font-weight:bold;margin:20px 0 10px;line-height:1.4;">$1</h2>`)
    .replace(/^## (.+)$/gm, `<h3 style="color:${color};font-size:18px;font-weight:bold;margin:16px 0 8px;line-height:1.4;">$1</h3>`)
    .replace(/^### (.+)$/gm, `<h4 style="color:${color};font-size:16px;font-weight:bold;margin:14px 0 6px;">$1</h4>`)
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${color};font-weight:bold;">$1</strong>`)
    // 斜体
    .replace(/\*(.+?)\*/g, `<em>$1</em>`)
    // 链接
    .replace(/\[(.+?)\]\((.+?)\)/g, `<a href="$2" style="color:${color};text-decoration:none;border-bottom:1px solid ${color};">$1</a>`)
    // 无序列表
    .replace(/^- (.+)$/gm, (_, t) => `<p style="margin:8px 0;padding-left:20px;"><span style="color:${color};">•</span> ${t}</p>`)
    // 有序列表
    .replace(/^\d+\. (.+)$/gm, `<p style="margin:8px 0;padding-left:20px;">$1</p>`)
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, `<pre style="background:#f4f4f4;border:1px solid #ddd;border-radius:6px;padding:12px;margin:12px 0;font-family:monospace;font-size:13px;overflow-x:auto;"><code>$2</code></pre>`)
    // 行内代码
    .replace(/`([^`]+)`/g, `<code style="background:#f4f4f4;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:13px;">$1</code>`)
    // 引用
    .replace(/^> (.+)$/gm, `<blockquote style="border-left:3px solid ${color};padding-left:12px;margin:12px 0;color:#666;font-style:italic;">$1</blockquote>`)
    // 水平线
    .replace(/^---$/gm, `<hr style="border-top:1px solid ${color};margin:20px 0;">`)
    // 段落
    ;

  // 包装成完整 HTML
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:677px;margin:0 auto;padding:20px 20px 60px;color:#333;line-height:1.8;font-size:15px;">
${html}
</body>
</html>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 获取 Access Token
function getAccessToken(appid, appsecret) {
  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appsecret}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.errcode) reject(new Error(`${json.errmsg} (${json.errcode})`));
          else resolve(json.access_token);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// 添加草稿
function addDraft(token, article) {
  return new Promise((resolve, reject) => {
    const articleData = {
      title: article.title,
      author: article.author,
      digest: article.digest,
      content: article.content,
      content_source_url: '',
      need_open_comment: 1,
      only_fans_can_comment: 0
    };

    // 只有 thumb_media_id 有值时才添加
    if (article.thumb_media_id) {
      articleData.thumb_media_id = article.thumb_media_id;
    }

    const postData = JSON.stringify({
      articles: [articleData]
    });

    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/draft/add?access_token=${token}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 从本地代理获取飞书账号配置
function getAccountFromProxy() {
  return new Promise((resolve, reject) => {
    http.get(`${CONFIG.proxyUrl}/accounts`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.ok && json.accounts && json.accounts.length > 0) {
            // 返回第一个账号（可扩展为选择逻辑）
            resolve(json.accounts[0]);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null)).end();
  });
}

// 启动
publish();