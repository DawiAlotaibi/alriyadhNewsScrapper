const puppeteer = require('puppeteer-extra');
const adblocker = require('puppeteer-extra-plugin-adblocker');
const fs = require('fs');
const path = require('path'); 

function convertNumbersToArabic(str) {
  const easternArabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return str.replace(/\d/g, (match) => easternArabicNumerals[parseInt(match)]);
}

puppeteer.use(adblocker());

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  await page.goto('https://www.alriyadh.com/news', { waitUntil: 'networkidle2', language: 'ar-SA' });

  const articleLinks = await page.evaluate(() => {
    const links = [];
    const articles = document.querySelectorAll('.entry-title a');
    articles.forEach((article) => {
      links.push(article.href);
    });
    return links;
  });

  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in ISO format

  const folderPath = path.join(__dirname, currentDate); // Create folder path using current date
  fs.mkdirSync(folderPath); // Create the folder

  for (const link of articleLinks) {
    const articlePage = await browser.newPage();
    await articlePage.setViewport({ width: 1080, height: 1920 });
    await articlePage.goto(link, { waitUntil: 'networkidle2', language: 'ar-SA' });
    const articleTitle = await articlePage.title();
    const fileName = convertNumbersToArabic(articleTitle.trim().split(" ")[0]) + '-' + Date.now() + '.png'; // Get first word of the title and add a timestamp
    const filePath = path.join(folderPath, fileName); // Create the file path within the folder

    await articlePage.evaluate(() => {
      const navBar = document.querySelector('body > div:nth-child(1) > nav > div');
      if (navBar) navBar.style.display = 'none';
    });
    await articlePage.evaluate(() => {
      const footer = document.querySelector('body > div:nth-child(1) > footer');
      if (footer) footer.style.display = 'none';
    });
    await articlePage.evaluate(() => {
      const side = document.evaluate('/html/body/div[1]/div[2]/div[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (side) side.style.display = 'none';
    });
    await articlePage.evaluate(() => {
      const side = document.evaluate('/html/body/div[1]/div[2]/div[1]/div[2]/div/div[12]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (side) side.style.display = 'none';
    });

    await articlePage.screenshot({ path: filePath, fullPage: true });
    console.log(`Screenshot saved: ${filePath}`);
    await articlePage.close();
  }

  await browser.close();
})();
