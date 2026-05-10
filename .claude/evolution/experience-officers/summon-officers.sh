#!/bin/bash
# 召唤体验官主脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OFFICERS_DIR="$SCRIPT_DIR"
PRODUCT_BRIEF="$OFFICERS_DIR/product-brief.md"
PAGE_CHECKLIST="$OFFICERS_DIR/page-checklist.md"
REPORT_TEMPLATE="$OFFICERS_DIR/report-template.md"
REPORTS_DIR="$OFFICERS_DIR/reports"
FEISHU_SCRIPT="$OFFICERS_DIR/send-feishu.sh"

# 创建报告目录
mkdir -p "$REPORTS_DIR"

# 读取配置文件
PRODUCT_BRIEF_CONTENT=$(cat "$PRODUCT_BRIEF")
PAGE_CHECKLIST_CONTENT=$(cat "$PAGE_CHECKLIST")

# 生成时间戳
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
OFFICER_COUNT=3

echo "🎮 召唤体验官..."
echo "时间: $TIMESTAMP"
echo "体验官数量: $OFFICER_COUNT"
echo ""

# 读取模板生成体验官 prompt
generate_officer_prompt() {
  local officer_id=$1
  cat "$OFFICERS_DIR/prompt-officer.md" | sed \
    -e "s/{OFFICER_ID}/$officer_id/g" \
    -e "s/{product_brief}/$(echo "$PRODUCT_BRIEF_CONTENT" | sed 's/[\/&]/\\&/g' | tr '\n' ' ')/g" \
    -e "s/{page_checklist}/$(echo "$PAGE_CHECKLIST_CONTENT" | sed 's/[\/&]/\\&/g' | tr '\n' ' ')/g" \
    -e "s/{reports_dir}/$REPORTS_DIR/g"
}

# 体验官列表
declare -a OFFICERS=("EO-001" "EO-002" "EO-003")

echo "========================================="
echo "体验官召唤完成！"
echo ""
echo "下一步："
echo "1. 每个体验官 Agent 将使用 MiniMax + WebBridge 体验产品"
echo "2. 体验完成后，将报告保存到: $REPORTS_DIR/"
echo "3. 手动汇总报告到 review.html"
echo "4. 运行: $FEISHU_SCRIPT '<飞书消息>' 发送通知"
echo "========================================="

# 生成示例报告用于测试
cat > "$REPORTS_DIR/report-example.md" << 'EOF'
# 体验官报告 - EO-001

## 基本信息
- 体验时间：2026-05-10 14:00
- 体验端：移动端
- 体验时长：约 15 分钟

## 发现的问题

### 🟡 一般问题（P1）
| 问题描述 | 严重程度 | 复现步骤 | 建议 |
|---------|---------|---------|------|
| 移动端输入框太小，点击困难 | P1 | 1. 使用手机浏览器打开<br>2. 切换到填空模式<br>3. 点击输入框 | 增加输入框高度，最小 44px |

### 🟢 轻微问题（P2）
| 问题描述 | 严重程度 | 复现步骤 | 建议 |
|---------|---------|---------|------|
| 桌面端导航栏图标缺少文字提示 | P2 | 1. 使用桌面浏览器打开<br>2. 悬停在导航按钮上 | 添加 tooltip |

## 亮点功能
- XP 弹窗动画很酷炫
- 连击系统激励机制好

## 整体感受
整体体验流畅，核心功能稳定。移动端适配有改进空间。
EOF

echo ""
echo "示例报告已生成: $REPORTS_DIR/report-example.md"
