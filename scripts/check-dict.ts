import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://dict.cn/search?q=ability', { waitUntil: 'networkidle' });
  
  // Get all li elements and check their content
  const allLis = await page.$$('li');
  console.log('Total li elements:', allLis.length);
  
  for (let i = 0; i < allLis.length; i++) {
    const text = await allLis[i].textContent() || '';
    // Look for li that contains English sentence (starts with uppercase, has ability)
    if (text.includes('ability') && text.length > 30 && text.length < 300) {
      const html = await allLis[i].evaluate(el => el.outerHTML.substring(0, 400));
      console.log(`\n=== li[${i}] ===`);
      console.log('Text:', text.trim().substring(0, 150));
      console.log('HTML:', html);
    }
  }
  
  await browser.close();
}

main().catch(console.error);
