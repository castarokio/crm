const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Parse .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const apiKey = env.GEMINI_API_KEY;
console.log('Using API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  try {
    // List models is not directly on genAI in all SDK versions, but let's test a few models:
    const modelsToTest = [
      'gemini-1.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro'
    ];

    for (const modelName of modelsToTest) {
      console.log(`Testing model: ${modelName}...`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("hello");
        console.log(`  Success! Response: ${result.response.text().trim().substring(0, 30)}`);
      } catch (err) {
        console.log(`  Failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}
run();
