const fs = require('fs');
const path = require('path');
const https = require('https');

// Get arguments: client folder name and competitor URL
const folderName = process.argv[2];
const urlToScrape = process.argv[3];

if (!folderName || !urlToScrape) {
  console.error('\x1b[31mError: Missing arguments.\x1b[0m');
  console.log('Usage: node scripts/scrape-competitor.js "client-folder-name" "https://competitor.com"');
  process.exit(1);
}

const targetFile = path.join(__dirname, '..', folderName, '02-market-research.md');

if (!fs.existsSync(targetFile)) {
  console.error(`\x1b[31mError: Target file not found at "${targetFile}".\x1b[0m`);
  console.log('Make sure you have created the client folder first using new-client.js.');
  process.exit(1);
}

// Clean URL for display
const cleanUrl = urlToScrape.trim();
const domain = new URL(cleanUrl).hostname;

console.log(`Scraping competitor website: \x1b[36m${cleanUrl}\x1b[0m via Jina Reader...`);

const jinaUrl = `https://r.jina.ai/${encodeURIComponent(cleanUrl)}`;

https.get(jinaUrl, (res) => {
  let data = '';

  if (res.statusCode !== 200) {
    console.error(`\x1b[31mError: Scraper returned status code ${res.statusCode}.\x1b[0m`);
    process.exit(1);
  }

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      console.log('Site fetched. Appending markdown to market research file...');
      
      const fileContent = fs.readFileSync(targetFile, 'utf8');
      
      const insertMarker = '---';
      const insertIndex = fileContent.indexOf(insertMarker);
      
      let newContent = '';
      const scrapedSection = `
## Scraped Data: ${domain} (${cleanUrl})
*Scraped on: ${new Date().toLocaleDateString()}*

\`\`\`markdown
${data.trim()}
\`\`\`

---
`;

      if (insertIndex !== -1) {
        // Insert right after the header line
        newContent = 
          fileContent.slice(0, insertIndex + insertMarker.length) + 
          scrapedSection + 
          fileContent.slice(insertIndex + insertMarker.length);
      } else {
        // Append to end of file if marker is not found
        newContent = fileContent + scrapedSection;
      }
      
      fs.writeFileSync(targetFile, newContent, 'utf8');
      console.log(`\n\x1b[32mSuccess! Competitor site markdown appended to: ./${folderName}/02-market-research.md\x1b[0m`);
    } catch (e) {
      console.error('\x1b[31mError processing file:\x1b[0m', e.message);
    }
  });
}).on('error', (err) => {
  console.error('\x1b[31mNetwork Error:\x1b[0m', err.message);
});
