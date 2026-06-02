const sqlite3 = require('sqlite3');
const fs = require('fs');

const localDbPath = 'C:/Users/elweh/Desktop/WORK/travel_agency_scraper/algeria_travel_agencies.db';
console.log('Checking database:', localDbPath);

if (!fs.existsSync(localDbPath)) {
  console.log('Database file does not exist.');
  process.exit(0);
}

const db = new sqlite3.Database(localDbPath);

db.all("SELECT call_status, count(*) as count FROM leads GROUP BY call_status", [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('SQLite Status counts:', rows);
  }
  db.close();
});
