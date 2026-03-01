#!/bin/bash
# Article WeChat Workflow - Generate, Approve, Publish to QQ Mail
#
# Configuration (set via environment variables or config file):
#   FEISHU_TARGET - Feishu user ID (open_id)
#   EMAIL_TO      - Target email address for sending articles
#
# Or create ~/.openclaw/config/article-wechat.json:
#   { "feishuTarget": "ou_xxx", "emailTo": "xxx@qq.com" }

# Load config from file if exists
CONFIG_FILE="$HOME/.openclaw/config/article-wechat.json"
if [ -f "$CONFIG_FILE" ]; then
    FEISHU_TARGET=$(cat "$CONFIG_FILE" | grep -o '"feishuTarget"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    EMAIL_TO=$(cat "$CONFIG_FILE" | grep -o '"emailTo"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
fi

# Override with environment variables if set
FEISHU_TARGET="${FEISHU_TARGET:-${ARTICLE_WEISHU_FTARGET:-}}"
EMAIL_TO="${EMAIL_TO:-${ARTICLE_EMAIL_TO:-}}"

# Fallback to empty - user must configure
[ -z "$FEISHU_TARGET" ] && FEISHU_TARGET="ou_your_feishu_id_here"
[ -z "$EMAIL_TO" ] && EMAIL_TO="your-email@example.com"

ARTICLE_FILE="$HOME/.openclaw/workspace/article-draft.md"
TOPIC_FILE="$HOME/.openclaw/workspace/article-topic.txt"
EMAIL_SKILL="$(dirname "$0")/../email/email.cjs"

CMD="$1"
shift

case "$CMD" in
    # Step 1: Ask for today's topic
    ask|topic)
        echo "📤 发送话题征集消息到飞书..."
        openclaw message send --channel feishu -t "$FEISHU_TARGET" -m "☀️ **今日文章主题征集**

请告诉我今天想写什么主题的文章？
例如：AI大模型进展、苹果最新动态、科技融资新闻等

直接回复主题即可，我会根据主题生成文章" 2>&1

        echo "✅ 已发送话题征集消息，请等待用户回复主题"
        ;;

    # Step 2: Generate article from topic (user provides topic as argument)
    generate|gen)
        TOPIC="$1"
        if [ -z "$TOPIC" ]; then
            echo "❌ 请提供文章主题"
            echo "用法: article-wechat generate \"AI大模型进展\""
            exit 1
        fi

        echo "📝 正在生成文章，主题: $TOPIC..."

        # Save topic
        echo "$TOPIC" > "$TOPIC_FILE"

        # Generate article ~500 words, directly in message
        ARTICLE_CONTENT=$(openclaw agent --agent main -m "请生成一篇微信公众号文章：$TOPIC

格式要求（非常重要，严格遵守）：
1. 总字数控制在500字左右（450-550字）
2. 标题：用一排星号包围如：***标题***
3. 导语：50字以内
4. 正文：4-5段，每段80-100字
5. 结尾：1个互动问题
Markdown（##、6. 禁止###、**、-、1.）
7. 可以用emoji
8. 中文标点

只输出文章内容，不要任何说明。" 2>&1)

        echo "$ARTICLE_CONTENT" > "$ARTICLE_FILE"

        echo "✅ 文章已生成！"
        echo ""
        echo "========== 预览 =========="
        cat "$ARTICLE_FILE"
        echo "=============================="
        echo ""

        # Send to Feishu for approval - content directly in message
        echo "📤 发送到飞书审批..."
        openclaw message send --channel feishu -t "$FEISHU_TARGET" -m "📝 **文章已生成**

主题：$TOPIC

$ARTICLE_CONTENT

---
回复【确认】发布到 QQ 邮箱
回复【重新生成】更新内容" 2>&1

        echo "✅ 已发送到飞书，请回复确认"
        ;;

    # Step 3: Send to email
    send|publish)
        if [ ! -f "$ARTICLE_FILE" ]; then
            echo "❌ 没有找到已生成的文章"
            exit 1
        fi

        TOPIC=$(cat "$TOPIC_FILE" 2>/dev/null || echo "今日文章")
        SUBJECT="📝 $TOPIC"
        echo "📤 发送到 QQ 邮箱..."
        node "$EMAIL_SKILL" send --to "$EMAIL_TO" --subject "$SUBJECT" --body-file "$ARTICLE_FILE"

        echo "✅ 已发送到邮箱！"
        ;;

    # Step 4: Preview
    preview)
        if [ ! -f "$ARTICLE_FILE" ]; then
            echo "❌ 没有找到已生成的文章"
            exit 1
        fi
        cat "$ARTICLE_FILE"
        ;;

    # Cron: Daily morning prompt
    cron-morning)
        echo "📤 发送今日话题征集..."
        openclaw message send --channel feishu -t "$FEISHU_TARGET" -m "☀️ **今日文章主题征集**

新的一天开始啦！

请告诉我今天想写什么主题的文章？
例如：AI大模型进展、苹果最新动态、科技融资新闻等

直接回复主题即可，我会根据主题生成文章" 2>&1
        echo "✅ 已发送话题征集消息"
        ;;

    *)
        echo "微信公众号文章工作流"
        echo ""
        echo "用法:"
        echo "  article-wechat ask           - 发送话题征集消息（让用户回复主题）"
        echo "  article-wechat generate <主题> - 根据主题生成文章并发送到飞书审批"
        echo "  article-wechat send         - 发送已生成的文章到QQ邮箱"
        echo "  article-wechat preview      - 预览已生成的文章"
        echo "  article-wechat cron-morning - 定时任务：发送话题征集"
        echo ""
        echo "示例:"
        echo "  article-wechat ask                    # 发送话题征集"
        echo "  article-wechat generate \"AI大模型进展\"  # 生成文章"
        echo "  article-wechat send                   # 发送到邮箱"
        ;;
esac
