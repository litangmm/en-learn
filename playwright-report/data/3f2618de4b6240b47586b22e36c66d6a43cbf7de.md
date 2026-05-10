# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice.spec.ts >> 听力词汇练习 >> 空数据时显示暂无数据提示
- Location: e2e/practice.spec.ts:11:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('暂无数据')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('暂无数据')

```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - banner:
        - generic:
          - generic:
            - generic:
              - img
            - generic:
              - heading [level=1]: 听力词汇练习
              - paragraph: 听句子，填单词
          - generic:
            - generic:
              - generic:
                - generic: Lv.1
              - button:
                - img
              - button:
                - img
              - button:
                - img
              - generic:
                - paragraph: "得分: 0"
            - generic:
              - button:
                - img
                - text: 错题本
              - button:
                - img
                - text: 学习记录
              - button:
                - img
                - text: 数据管理
              - button:
                - img
                - text: 智能复习
              - button:
                - img
                - generic: 每日挑战
              - button:
                - img
                - generic: 成就
              - button:
                - img
                - text: 排行
              - combobox:
                - generic: CET-4
                - img
              - button: 重置
      - main:
        - generic:
          - generic:
            - group:
              - radio [checked]: 填空模式
              - radio: 听写模式
              - radio: 选择题模式
              - radio: 连词成句
          - button:
            - img
            - text: 专注模式
        - generic:
          - generic:
            - generic: 进度
            - generic: 1 / 10
        - generic:
          - generic:
            - generic:
              - generic:
                - generic: 第 1/10 题
              - generic:
                - group:
                  - radio: 0.5x
                  - radio: 0.75x
                  - radio [checked]: 1x
                  - radio: 1.25x
                  - radio: 1.5x
                - button:
                  - img
                  - text: 播放音频
            - generic:
              - generic:
                - generic:
                  - paragraph: "\"much information is available through computers\""
                - generic:
                  - generic:
                    - generic: 中文释义
                - generic:
                  - paragraph: "\"much information is available through computers\""
            - generic:
              - generic:
                - button: 提交答案
        - generic:
          - paragraph: 听音频后，在输入框中填入缺失的单词，按 Enter 键快速提交
  - dialog "欢迎使用 en-learn" [ref=e2]:
    - generic [ref=e3]:
      - heading "欢迎使用 en-learn" [level=2] [ref=e4]
      - paragraph [ref=e5]: 让我们一起开始学习英语吧！
    - generic [ref=e6]:
      - generic [ref=e7]:
        - heading "功能介绍" [level=3] [ref=e8]
        - list [ref=e9]:
          - listitem [ref=e10]:
            - generic [ref=e11]: 📖
            - generic [ref=e12]:
              - text: 词典练习
              - paragraph [ref=e13]: 选择不同词库进行针对性学习
          - listitem [ref=e14]:
            - generic [ref=e15]: 🎯
            - generic [ref=e16]:
              - text: 多种模式
              - paragraph [ref=e17]: 填空、听写、选择、连词成句
          - listitem [ref=e18]:
            - generic [ref=e19]: ⭐
            - generic [ref=e20]:
              - text: XP 等级
              - paragraph [ref=e21]: 答题获取经验值，解锁成就徽章
          - listitem [ref=e22]:
            - generic [ref=e23]: 🏆
            - generic [ref=e24]:
              - text: 每日挑战
              - paragraph [ref=e25]: 完成任务获得额外奖励
          - listitem [ref=e26]:
            - generic [ref=e27]: 🧠
            - generic [ref=e28]:
              - text: 智能复习
              - paragraph [ref=e29]: 基于遗忘曲线自动安排复习
      - generic [ref=e30]:
        - heading "选择要学习的词典" [level=3] [ref=e31]
        - generic [ref=e32]:
          - button "CET-4 大学英语四级" [active] [ref=e33] [cursor=pointer]:
            - generic [ref=e34]: CET-4
            - generic [ref=e35]: 大学英语四级
          - button "CET-6 大学英语六级" [ref=e36] [cursor=pointer]:
            - generic [ref=e37]: CET-6
            - generic [ref=e38]: 大学英语六级
          - button "IELTS 雅思词汇" [ref=e39] [cursor=pointer]:
            - generic [ref=e40]: IELTS
            - generic [ref=e41]: 雅思词汇
          - button "TOEFL 托福词汇" [ref=e42] [cursor=pointer]:
            - generic [ref=e43]: TOEFL
            - generic [ref=e44]: 托福词汇
    - button "开始学习" [ref=e46] [cursor=pointer]
    - button "Close" [ref=e47] [cursor=pointer]:
      - img
      - generic [ref=e48]: Close
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('听力词汇练习', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/');
  6  |     // 等待页面完全加载
  7  |     await page.waitForLoadState('networkidle');
  8  |     await page.waitForTimeout(1000);
  9  |   });
  10 | 
  11 |   test('空数据时显示暂无数据提示', async ({ page }) => {
> 12 |     await expect(page.getByText('暂无数据')).toBeVisible();
     |                                          ^ Error: expect(locator).toBeVisible() failed
  13 |   });
  14 | 
  15 |   test('页面加载后不报错', async ({ page }) => {
  16 |     // 检查控制台没有严重错误
  17 |     const errors: string[] = [];
  18 |     page.on('pageerror', (err) => errors.push(err.message));
  19 | 
  20 |     await page.goto('/');
  21 |     await page.waitForLoadState('networkidle');
  22 |     await page.waitForTimeout(1000);
  23 | 
  24 |     expect(errors).toEqual([]);
  25 |   });
  26 | });
  27 | 
```