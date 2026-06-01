const fs = require('fs');
const path = require('path');

// Get client name from command line arguments
const clientName = process.argv.slice(2).join(' ').trim();

if (!clientName) {
  console.error('\x1b[31mError: Please provide a client name.\x1b[0m');
  console.log('Usage: node scripts/new-client.js "Client Name"');
  process.exit(1);
}

// Create slug/folder name (e.g., "Tesla Detailing" -> "tesla-detailing")
const folderName = clientName
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
  .replace(/\s+/g, '-')         // Replace spaces with hyphens
  .replace(/-+/g, '-');         // Deduplicate hyphens

const targetDir = path.join(__dirname, '..', folderName);
const templateDir = path.join(__dirname, '..', '_website_os_templates');

if (fs.existsSync(targetDir)) {
  console.error(`\x1b[31mError: Directory "${folderName}" already exists.\x1b[0m`);
  process.exit(1);
}

console.log(`Creating workspace for: \x1b[36m${clientName}\x1b[0m...`);
fs.mkdirSync(targetDir, { recursive: true });

// Copy and parse templates
try {
  const files = fs.readdirSync(templateDir);
  
  files.forEach(file => {
    const srcPath = path.join(templateDir, file);
    const destFileName = file.replace('-template.md', '.md');
    const destPath = path.join(targetDir, destFileName);
    
    let content = fs.readFileSync(srcPath, 'utf8');
    
    // Replace placeholder with actual Client Name
    content = content.replace(/\[Client Name\]/g, clientName);
    
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`  Created: ${destFileName}`);
  });
  
  console.log(`\n\x1b[32mSuccess! Client folder created at: ./${folderName}\x1b[0m`);
  console.log(`Next Step: Open \x1b[34m./${folderName}/01-client-brief.md\x1b[0m and fill in the intake details.`);
} catch (error) {
  console.error('\x1b[31mError copying template files:\x1b[0m', error.message);
}
