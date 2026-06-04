const fs = require('fs');
const path = require('path');
const https = require('https');

const fonts = [
  // Outfit
  { name: 'outfit-300.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-300-normal.woff2', dir: 'outfit' },
  { name: 'outfit-400.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-400-normal.woff2', dir: 'outfit' },
  { name: 'outfit-500.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-500-normal.woff2', dir: 'outfit' },
  { name: 'outfit-600.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-600-normal.woff2', dir: 'outfit' },
  { name: 'outfit-700.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-700-normal.woff2', dir: 'outfit' },
  { name: 'outfit-800.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-800-normal.woff2', dir: 'outfit' },

  // Space Grotesk
  { name: 'space-grotesk-400.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-400-normal.woff2', dir: 'space-grotesk' },
  { name: 'space-grotesk-500.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-500-normal.woff2', dir: 'space-grotesk' },
  { name: 'space-grotesk-600.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-600-normal.woff2', dir: 'space-grotesk' },
  { name: 'space-grotesk-700.woff2', url: 'https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.woff2', dir: 'space-grotesk' }
];

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const request = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          request(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to get '${targetUrl}' (${response.statusCode})`));
          return;
        }
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    };
    request(url);
  });
};

async function main() {
  const publicFontsDir = path.join(__dirname, '..', 'public', 'fonts');
  console.log(`Target fonts directory: ${publicFontsDir}`);

  for (const font of fonts) {
    const targetDir = path.join(publicFontsDir, font.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const dest = path.join(targetDir, font.name);
    console.log(`Downloading ${font.name}...`);
    try {
      await download(font.url, dest);
      console.log(`Downloaded ${font.name} successfully to ${dest}`);
    } catch (err) {
      console.error(`Failed to download ${font.name}:`, err.message);
    }
  }
  console.log('All downloads completed.');
}

main();
