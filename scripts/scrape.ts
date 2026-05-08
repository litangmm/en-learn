import { chromium, Browser, Page } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { wordLists } from './wordlists.js';
import type { Sentence } from '../src/data/types.js';

const OUTPUT_DIR = 'src/data';
const PROGRESS_DIR = 'scripts/.progress';
const BASE_URL = 'https://dict.cn/search';
const MIN_DELAY = 500;
const MAX_DELAY = 1500;
const MAX_RETRIES = 3;
const MIN_SENTENCE_LENGTH = 30;
const MAX_SENTENCE_LENGTH = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): number {
  return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
}

function getProgressFile(level: string): string {
  return `${PROGRESS_DIR}/${level}.txt`;
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadProgress(level: string): Set<string> {
  const file = getProgressFile(level);
  if (!existsSync(file)) {
    return new Set();
  }
  const content = new TextDecoder().decode(
    new Uint8Array(require('fs').readFileSync(file))
  );
  return new Set(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  );
}

function saveProgress(level: string, word: string): void {
  const file = getProgressFile(level);
  const fs = require('fs');
  fs.appendFileSync(file, word + '\n');
}

function sanitizeSentence(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim();
}

function containsWord(sentence: string, word: string): boolean {
  const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return regex.test(sentence);
}

async function scrapeWord(page: Page, word: string, level: string): Promise<Sentence[]> {
  const sentences: Sentence[] = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${BASE_URL}?q=${encodeURIComponent(word)}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for sentence list to appear
      await page.waitForSelector('.sent-list li, .sent-list .sent-item', { timeout: 10000 }).catch(() => {
        // Some words may not have example sentences
      });

      const results = await page.evaluate((targetWord: string, minLen: number, maxLen: number) => {
        const items: Array<{ english: string; chinese: string }> = [];
        const listItems = document.querySelectorAll('.sent-list li, .sent-list .sent-item');

        for (const li of Array.from(listItems)) {
          const enEl = li.querySelector('.sent-eng, .en, .english, p:first-child');
          const cnEl = li.querySelector('.sent-chs, .cn, .chinese, p:last-child');

          const english = enEl?.textContent?.trim() || '';
          const chinese = cnEl?.textContent?.trim() || '';

          if (
            english &&
            chinese &&
            english.length >= minLen &&
            english.length <= maxLen &&
            new RegExp(`\\b${targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(english)
          ) {
            items.push({ english, chinese });
          }
        }

        return items;
      }, word, MIN_SENTENCE_LENGTH, MAX_SENTENCE_LENGTH);

      for (const result of results.slice(0, 3)) {
        const english = sanitizeSentence(result.english);
        const chinese = sanitizeSentence(result.chinese);

        if (containsWord(english, word)) {
          sentences.push({
            id: `${level}-${word}-${sentences.length + 1}`,
            english,
            chinese,
            blanks: [{ word, hint: '' }],
            level,
          });
        }
      }

      if (sentences.length > 0) {
        return sentences;
      }

      // No sentences found, but page loaded successfully
      return [];
    } catch (error) {
      const err = error as Error;
      console.warn(`  Attempt ${attempt} failed for "${word}": ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(randomDelay() * attempt);
      }
    }
  }

  return [];
}

function generateDataFile(level: string, sentences: Sentence[]): void {
  const filePath = `${OUTPUT_DIR}/${level}.ts`;
  const content = `import { Sentence } from './types';

export const sentences: Sentence[] = [
${sentences
  .map(
    (s) => `  {
    id: '${s.id}',
    english: '${s.english.replace(/'/g, "\\'")}',
    chinese: '${s.chinese.replace(/'/g, "\\'")}',
    blanks: [{ word: '${s.blanks[0]?.word || ''}', hint: '${s.blanks[0]?.hint || ''}' }],
    level: '${s.level}',
  },`
  )
  .join('\n')}
];
`;

  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
}

async function scrapeLevel(browser: Browser, level: string, words: string[]): Promise<void> {
  console.log(`\n=== Scraping level: ${level} (${words.length} words) ===`);

  const progress = loadProgress(level);
  const allSentences: Sentence[] = [];
  let completed = 0;
  let failed = 0;
  let skipped = 0;

  // Load existing data if present
  const dataFile = `${OUTPUT_DIR}/${level}.ts`;
  if (existsSync(dataFile)) {
    try {
      const existing = await import(`../${dataFile}`);
      if (Array.isArray(existing.sentences)) {
        allSentences.push(...existing.sentences);
      }
    } catch {
      // Ignore import errors
    }
  }

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  for (const word of words) {
    if (progress.has(word)) {
      skipped++;
      continue;
    }

    console.log(`[${level}] ${word} (${completed + 1}/${words.length})`);

    const sentences = await scrapeWord(page, word, level);

    if (sentences.length > 0) {
      allSentences.push(...sentences);
      completed++;
      saveProgress(level, word);
    } else {
      console.warn(`  No sentences found for "${word}"`);
      failed++;
      // Still mark as processed to avoid endless retries
      saveProgress(level, word);
    }

    // Rate limiting
    await sleep(randomDelay());
  }

  await context.close();

  // Generate output file
  generateDataFile(level, allSentences);

  console.log(`Level ${level} done: ${completed} succeeded, ${failed} failed, ${skipped} skipped`);
  console.log(`Total sentences: ${allSentences.length}`);
}

async function main(): Promise<void> {
  ensureDir(OUTPUT_DIR);
  ensureDir(PROGRESS_DIR);

  const browser = await chromium.launch({ headless: true });

  try {
    for (const [level, words] of Object.entries(wordLists)) {
      await scrapeLevel(browser, level, words);
    }
  } finally {
    await browser.close();
  }

  console.log('\nAll levels scraped successfully!');
}

main().catch((error) => {
  console.error('Scraper failed:', error);
  process.exit(1);
});
