const fs = require('fs');
const files = ['s:/Websites/OTL-System/src/pages/Marketing.jsx', 's:/Websites/OTL-System/src/pages/AdminHub.jsx'];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  
  // Find inline grids with 4 or more columns (e.g., '1.2fr 1fr 1fr 1fr' or '100px 1fr ...')
  // We want to ensure they have a minWidth so they trigger overflow instead of squishing text infinitely.
  // Example pattern: style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr 1fr 1fr', ... }}
  
  c = c.replace(/style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'([^']+)',/g, (match, cols) => {
    // Count columns roughly by splitting spaces
    const parts = cols.split(/\s+/).filter(p => p.trim() !== '');
    if (parts.length >= 4 && !cols.includes('auto-fill') && !cols.includes('auto-fit')) {
      return match + ' minWidth: "700px",';
    }
    return match;
  });

  fs.writeFileSync(f, c);
  console.log(f + ' added minWidth to large grids');
});
