/**
 * upload-thumb.js
 * 上传固定封面图到微信永久素材，获取 media_id
 */

const https = require('https');
const fs = require('fs');
const http = require('http');

// 飞书账号配置
const PROXY_URL = 'http://localhost:7788';

// 封面图路径（可修改）
const THUMB_PATH = 'C:/Users/Bear/Pictures/640.jpg';

async function main() {
  console.log('📤 开始上传封面图...\n');

  // 1. 获取账号配置
  console.log('🔍 获取飞书账号配置...');
  const accounts = await fetchAccounts();
  if (!accounts || accounts.length === 0) {
    console.error('❌ 无法获取飞书账号');
    process.exit(1);
  }
  console.log(`✅ 找到 ${accounts.length} 个账号\n`);

  // 2. 为每个账号上传封面
  for (const acc of accounts) {
    console.log(`📋 处理账号: ${acc.name} (${acc.appid})`);

    if (!acc.appid || !acc.appsecret) {
      console.log(`   ⏭️ 跳过（无 appid/appsecret）\n`);
      continue;
    }

    try {
      // 获取 token
      console.log('   🔑 获取 Access Token...');
      const token = await getAccessToken(acc.appid, acc.appsecret);
      console.log(`   ✅ Token 获取成功`);

      // 上传图片
      console.log('   🖼️  上传封面图到永久素材...');
      const mediaId = await uploadThumb(token, THUMB_PATH);
      console.log(`   ✅ 上传成功! media_id: ${mediaId}`);

      // 更新飞书表格（这里只显示，实际需要 update）
      console.log(`   💾 建议更新飞书表格 mediaId 列为: ${mediaId}`);

    } catch (err) {
      console.log(`   ❌ 失败: ${err.message}\n`);
    }
    console.log('');
  }
}

function fetchAccounts() {
  return new Promise((resolve, reject) => {
    http.get(`${PROXY_URL}/accounts`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.accounts || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).end();
  });
}

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

function uploadThumb(token, filePath) {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const ext = filePath.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const boundary = '----WechatUploader' + Date.now();
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="media"; filename="thumb.${ext}"\r\n`),
      Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
      fileData,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/cgi-bin/material/add_material?access_token=${token}&type=image`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.errcode) reject(new Error(`${json.errmsg} (${json.errcode})`));
          else resolve(json.media_id);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

main();