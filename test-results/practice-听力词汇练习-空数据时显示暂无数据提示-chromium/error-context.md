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
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e8]
        - generic [ref=e10]:
          - heading "听力词汇练习" [level=1] [ref=e11]
          - paragraph [ref=e12]: 听句子，填单词
      - generic [ref=e13]:
        - paragraph [ref=e15]: "得分: 0"
        - generic [ref=e16]:
          - button "错题本" [ref=e17] [cursor=pointer]:
            - img
            - text: 错题本
          - button "学习记录" [ref=e18] [cursor=pointer]:
            - img
            - text: 学习记录
          - button "数据管理" [ref=e19] [cursor=pointer]:
            - img
            - text: 数据管理
          - button "智能复习" [ref=e20] [cursor=pointer]:
            - img
            - text: 智能复习
          - combobox [ref=e21] [cursor=pointer]:
            - generic: CET-4
            - img
          - button "重置" [ref=e22] [cursor=pointer]
  - main [ref=e23]:
    - generic [ref=e24]:
      - group [ref=e25]:
        - radio "填空模式" [checked] [ref=e26] [cursor=pointer]
        - radio "听写模式" [ref=e27] [cursor=pointer]
        - radio "选择题模式" [ref=e28] [cursor=pointer]
        - radio "连词成句" [ref=e29] [cursor=pointer]
      - button "专注模式" [ref=e30] [cursor=pointer]:
        - img
        - text: 专注模式
    - generic [ref=e32]:
      - generic [ref=e33]: 进度
      - generic [ref=e34]: 1 / 10
    - generic [ref=e37]:
      - generic [ref=e38]:
        - generic [ref=e40]: 第 1/10 题
        - generic [ref=e41]:
          - group [ref=e42]:
            - radio "0.5x" [ref=e43] [cursor=pointer]
            - radio "0.75x" [ref=e44] [cursor=pointer]
            - radio "1x" [checked] [ref=e45] [cursor=pointer]
            - radio "1.25x" [ref=e46] [cursor=pointer]
            - radio "1.5x" [ref=e47] [cursor=pointer]
          - button "播放音频" [ref=e48] [cursor=pointer]:
            - img
            - text: 播放音频
      - generic [ref=e49]:
        - paragraph [ref=e51]: 例如,可能会为每个订单分配一个唯一的订单号。
        - generic [ref=e56]: 英文句子
        - generic [ref=e57]:
          - text: For example, you might
          - textbox "1" [ref=e59]
          - text: each order a unique order number.
      - button "提交答案" [ref=e61] [cursor=pointer]
    - paragraph [ref=e63]: 听音频后，在输入框中填入缺失的单词，按 Enter 键快速提交
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