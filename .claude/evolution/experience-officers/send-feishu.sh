#!/bin/bash
# 发送飞书通知脚本

# 获取参数
MESSAGE="$1"

if [ -z "$MESSAGE" ]; then
  echo "Usage: ./send-feishu.sh '<message>'"
  exit 1
fi

WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/144552f8-3672-452e-8b62-f4fda4be0539"

# 构建 JSON 消息
JSON=$(cat <<EOF
{
  "msg_type": "text",
  "content": {
    "text": "$MESSAGE"
  }
}
EOF
)

# 发送请求
curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$JSON"

echo ""
