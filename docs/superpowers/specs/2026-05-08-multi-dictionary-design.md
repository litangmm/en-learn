# 多词典切换功能设计文档

## 背景

当前项目的词汇和例句是硬编码在 `src/data/sentences.ts` 中的 20 条静态数据。需要扩展为支持多个级别词典（初中/高中/CET-4/CET-6/雅思/托福/GRE），并且每个级别包含全量核心词汇的例句。

## 目标

1. 支持 7 个级别的词典切换
2. 每个级别包含全量核心词汇（每个核心词汇一条例句）
3. 切换词典时动态加载对应数据
4. 保持现有"听句子填单词"的练习模式不变

## 数据结构设计

### 核心类型

```typescript
// src/data/types.ts
export interface Sentence {
  id: string;           // 格式: "{level}-{序号}"，如 "cet4-001"
  english: string;      // 英文例句
  chinese: string;      // 中文翻译
  blanks: Blank[];      // 需要填写的单词
  level: string;        // 所属级别
}

export interface Blank {
  word: string;         // 正确答案
  hint?: string;        // 中文提示
}

export interface Dictionary {
  id: string;           // 标识: junior/senior/cet4/cet6/ielts/toefl/gre
  name: string;         // 显示名称: 如 "CET-4"
  description: string;  // 简介
  sentenceCount: number;
}
```

### 文件组织

```
src/data/
├── types.ts              # 公共类型定义
├── dictionaries.ts       # 词典元数据列表
├── loader.ts             # 动态加载函数
├── junior.ts             # 初中词汇 (~1,600条)
├── senior.ts             # 高中词汇 (~2,000条)
├── cet4.ts               # CET-4词汇 (~1,500条)
├── cet6.ts               # CET-6词汇 (~1,500条)
├── ielts.ts              # 雅思词汇 (~2,000条)
├── toefl.ts              # 托福词汇 (~2,000条)
└── gre.ts                # GRE词汇 (~3,000条)
```

### 动态加载

```typescript
// src/data/loader.ts
export async function loadDictionary(id: string): Promise<Sentence[]> {
  switch (id) {
    case 'junior': return (await import('./junior')).sentences;
    case 'senior': return (await import('./senior')).sentences;
    case 'cet4':   return (await import('./cet4')).sentences;
    case 'cet6':   return (await import('./cet6')).sentences;
    case 'ielts':  return (await import('./ielts')).sentences;
    case 'toefl':  return (await import('./toefl')).sentences;
    case 'gre':    return (await import('./gre')).sentences;
    default: throw new Error(`Unknown dictionary: ${id}`);
  }
}
```

## 数据爬取方案

### 数据来源

1. **词汇列表**：从公开词频数据和考试词表获取（COCA、各类考试官方词表）
2. **例句**：通过浏览器模拟访问海词(dict.cn)或有道词典获取带中文翻译的例句

### 爬取流程

1. 获取目标级别的词汇列表（已去重、按频率排序）
2. 对每个词汇，模拟浏览器请求词典网站
3. 提取第一条包含该词的例句及其中文翻译
4. 将目标词作为 `blank`，生成 `Sentence` 对象
5. 输出为 TypeScript 文件

### 质量控制

- 过滤例句过长（>150字符）或过短（<30字符）的数据
- 确保中文翻译字段存在
- 验证例句中确实包含目标词或其常见变形
- 按级别分别保存文件

## UI 设计

### 词典切换器

位置：Header 标题右侧

```
┌─────────────────────────────────────────┐
│  🎧  听力词汇练习    [ CET-4  ▼ ]   重置  │
│        听句子，填单词                      │
└─────────────────────────────────────────┘
```

组件：使用项目已有的 Radix UI Select（shadcn/ui）

### 切换交互

1. 点击下拉显示 7 个词典选项
2. 选择后弹出确认："切换词典将重新开始练习，确定吗？"
3. 确认后进入加载状态
4. 动态加载新词典数据
5. 加载完成后重置练习状态，自动播放第一题音频

### 加载状态

```
┌────────────────────────────┐
│        🎧                  │
│      加载中...              │
│   正在加载 CET-6 词汇...    │
└────────────────────────────┘
```

### 错误状态

加载失败时显示：
- 错误提示信息
- "重试" 按钮

## 状态管理改造

### usePractice Hook 改造

```typescript
export function usePractice(dictionaryId: string) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 异步加载词典数据
  useEffect(() => {
    loadDictionary(dictionaryId)
      .then(data => {
        setSentences(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [dictionaryId]);
  
  const shuffledSentences = useMemo(() => {
    if (sentences.length === 0) return [];
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10); // 每轮10题
  }, [sentences]);
  
  // ...其余状态逻辑不变
}
```

### App.tsx 改造

```typescript
function App() {
  const [dictionaryId, setDictionaryId] = useState('cet4');
  const [showDictionarySwitch, setShowDictionarySwitch] = useState(false);
  
  const {
    state,
    currentSentence,
    isLoading,
    error,
    // ...
  } = usePractice(dictionaryId);
  
  const handleDictionaryChange = (newId: string) => {
    if (newId === dictionaryId) return;
    // 确认弹窗
    setDictionaryId(newId);
  };
  
  // 加载状态渲染
  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={...} />;
  
  // ...正常渲染
}
```

## 数据流

```
用户选择词典
    ↓
App 更新 dictionaryId
    ↓
usePractice 调用 loadDictionary(id)
    ↓
动态 import() 加载对应 .ts 文件
    ↓
数据加载完成 → setSentences()
    ↓
shuffledSentences 重新计算（随机抽取10题）
    ↓
初始化 inputs
    ↓
自动播放第一题音频
    ↓
开始练习
```

## 性能考量

- **按需加载**：每个级别单独文件，只加载用户当前选择的词典
- **缓存**：浏览器会缓存已加载的模块，切换回已访问的词典时秒开
- **每轮10题**：即使词典有数千条，每轮只随机抽取10题练习，响应快

## 错误处理

| 场景 | 处理 |
|------|------|
| 网络超时 | 显示"加载超时，请检查网络"，提供重试按钮 |
| 模块加载失败 | 显示"词典加载失败"，提供重试按钮 |
| 词典数据为空 | 显示"该词典暂无数据"，引导切换其他词典 |

## 不变的部分

- 练习模式：听句子填单词，保持不变
- 评分逻辑：答对得分，多次尝试扣分，保持不变
- 音频播放：使用 Web Speech API，保持不变
- 输入交互：按 Enter 提交，保持不变

## 实现顺序

1. 创建数据类型和词典元数据
2. 写爬虫脚本并爬取所有级别数据
3. 实现动态加载函数
4. 改造 usePractice hook
5. 添加词典切换 UI
6. 添加加载/错误状态
7. 测试验证
