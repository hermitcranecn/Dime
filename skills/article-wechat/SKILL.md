---
name: article-wechat
description: "生成微信公众号文章并发送到QQ邮箱审批发布流程"
metadata: { "openclaw": { "emoji": "📱", "requires": { "bins": ["bash", "node"] } } }
---

# 微信公众号文章工作流

生成 AI 文章 → 飞书审批 → QQ邮箱发布

## 配置

首次使用需要配置飞书用户 ID 和目标邮箱：

**方式1: 环境变量**

```bash
export ARTICLE_FEISHU_TARGET="ou_your_feishu_id"
export ARTICLE_EMAIL_TO="your-email@qq.com"
```

**方式2: 配置文件**
创建 `~/.openclaw/config/article-wechat.json`:

```json
{
  "feishuTarget": "ou_your_feishu_id",
  "emailTo": "your-email@qq.com"
}
```

**获取飞书 ID:**

- 飞书 → 设置 → 关于 → 点击头像 → 复制用户 ID

## 使用方法

```bash
# 发送话题征集消息
article-wechat ask

# 根据主题生成文章并发送到飞书审批
article-wechat generate "AI大模型进展"

# 发送已生成的文章到邮箱
article-wechat send
```

## 定时任务

每天早上9:30自动发送话题征集：

```bash
crontab -e
30 9 * * 1-5 /path/to/skills/article-wechat/article-wechat.sh cron-morning
```

## 工作流程

1. 定时/手动发送话题征集到飞书
2. 用户回复主题
3. AI 生成500字公众号格式文章
4. 直接发送到飞书消息
5. 用户回复"确认" → 自动发送到QQ邮箱
6. 手动复制到公众号发布
