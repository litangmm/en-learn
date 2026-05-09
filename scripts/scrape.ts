import { chromium, BrowserContext } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { wordLists } from './wordlists.ts';
import type { Sentence } from '../src/data/types.ts';

const OUTPUT_DIR = 'src/data';
const PROGRESS_DIR = 'scripts/.progress';
const BASE_URL = 'https://dict.cn/search';
// const CONCURRENCY = 4;
const PAGE_TIMEOUT = 10000;
const NAV_TIMEOUT = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function loadProgress(level: string): Set<string> {
  const file = `${PROGRESS_DIR}/${level}.txt`;
  if (!existsSync(file)) return new Set();
  const content = readFileSync(file, 'utf-8');
  return new Set(content.split('\n').map((l) => l.trim()).filter(Boolean));
}

function saveProgress(level: string, word: string): void {
  ensureDir(PROGRESS_DIR);
  writeFileSync(`${PROGRESS_DIR}/${level}.txt`, word + '\n', { flag: 'a' });
}

function sanitize(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/[\n\r\t]/g, ' ').trim();
}

async function scrapeWord(
  context: BrowserContext,
  word: string,
  level: string
): Promise<Sentence[]> {
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  page.setDefaultTimeout(PAGE_TIMEOUT);

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(word)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const results = await page.evaluate(
      ({ targetWord, minLen, maxLen }: { targetWord: string; minLen: number; maxLen: number }) => {
        const items: Array<{ english: string; chinese: string }> = [];
        const listItems = document.querySelectorAll('li');

        for (const li of Array.from(listItems)) {
          const html = li.innerHTML;
          if (!html.includes('<br>')) continue;

          const parts = html.split('<br>');
          if (parts.length < 2) continue;

          const english = parts[0].replace(/<[^>]+>/g, '').trim();
          const chinese = parts[1].replace(/<[^>]+>/g, '').trim();

          if (
            english &&
            chinese &&
            english.length >= minLen &&
            english.length <= maxLen &&
            new RegExp(
              `\\b${targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
              'i'
            ).test(english)
          ) {
            items.push({ english, chinese });
          }
        }
        return items;
      },
      { targetWord: word, minLen: 20, maxLen: 150 }
    );

    const sentences: Sentence[] = [];
    for (const result of results.slice(0, 1)) {
      sentences.push({
        id: `${level}-${word}`,
        english: sanitize(result.english),
        chinese: sanitize(result.chinese),
        blanks: [{ word, hint: '' }],
        level,
      });
    }

    return sentences;
  } catch {
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

async function scrapeLevel(level: string, words: string[]): Promise<Sentence[]> {
  console.log(`\n=== ${level}: ${words.length} words ===`);

  const progress = loadProgress(level);
  const allSentences: Sentence[] = [];
  let done = 0;
  let failed = 0;
  let skipped = 0;

  const context = await chromium.launch({ headless: true }).then((browser) =>
    browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    })
  );

  for (const word of words) {
    if (progress.has(word)) {
      skipped++;
      continue;
    }

    const sentences = await scrapeWord(context, word, level);

    if (sentences.length > 0) {
      allSentences.push(...sentences);
      done++;
      saveProgress(level, word);
      if (done % 10 === 0) {
        console.log(`  ${done}/${words.length} done (${failed} failed)`);
      }
    } else {
      failed++;
    }

    await sleep(200 + Math.random() * 300);
  }

  await context.browser()?.close();
  console.log(`  Result: ${done} found, ${failed} failed, ${skipped} skipped`);
  return allSentences;
}

async function main() {
  for (const [level, words] of Object.entries(wordLists)) {
    if (words.length === 0) continue;

    const sentences = await scrapeLevel(level, words);

    const content = `import { Sentence } from './types';

export const sentences: Sentence[] = [
${sentences
  .map(
    (s) => `  {
    id: ${JSON.stringify(s.id)},
    english: ${JSON.stringify(s.english)},
    chinese: ${JSON.stringify(s.chinese)},
    blanks: [{ word: ${JSON.stringify(s.blanks[0]?.word || '')}, hint: '' }],
    level: ${JSON.stringify(s.level)},
  },`
  )
  .join('\n')}
];
`;

    const filePath = `${OUTPUT_DIR}/${level}.ts`;
    ensureDir(dirname(filePath));
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  Saved ${sentences.length} sentences to ${filePath}\n`);
  }
}

main().catch(console.error);
