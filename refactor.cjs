const fs = require('fs');
let f = 's:/Websites/OTL-System/src/pages/Accounting.jsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr'([^}]*)\}\}/g, 'className="grid-responsive-2" style={{$1}}');
c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1\.2fr 1fr'([^}]*)\}\}/g, 'className="grid-responsive-2" style={{$1}}');
c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1\.5fr 1fr'([^}]*)\}\}/g, 'className="grid-responsive-2" style={{$1}}');
c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'2fr 1fr'([^}]*)\}\}/g, 'className="grid-responsive-2" style={{$1}}');
c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\\(3,\s*1fr\\)'([^}]*)\}\}/g, 'className="grid-responsive-3" style={{$1}}');
c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr 1fr'([^}]*)\}\}/g, 'className="grid-responsive-3" style={{$1}}');
c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\\(4,\s*1fr\\)'([^}]*)\}\}/g, 'className="grid-responsive-4" style={{$1}}');
c = c.replace(/style=\{\{\s*marginTop:\s*'20px',\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr'([^}]*)\}\}/g, 'className="grid-responsive-2" style={{ marginTop: "20px", $1 }}');
// Accounting table grid fix
c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 80px 140px 36px'([^}]*)\}\}/g, 'className="grid-quote-items" style={{$1}}');

fs.writeFileSync(f, c);
console.log('Accounting.jsx refactored successfully.');
