const fs = require('fs');
const files = ['s:/Websites/OTL-System/src/pages/Marketing.jsx', 's:/Websites/OTL-System/src/pages/AdminHub.jsx'];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  
  // Wrap table headers and rows in an overflow container.
  // Actually, the easiest way is to target the grid containers that don't have auto-fill.
  // But wait, the tabular data in OTL-System often uses divs with explicit grid columns.
  // For example: <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr...' }}>
  // If we just add a utility class to index.css and wrap the tabular areas, that would be ideal.
  // Alternatively, we can just find all glass-cards and ensure they don't force overflow.
  
  // Let's add overflowX: 'auto' to all glass-cards to make them scrollable if their content is too wide.
  // In React JSX: className="glass-card" style={{ padding: '25px', overflowX: 'auto' }}
  
  c = c.replace(/className="glass-card"\s*style=\{\{([^}]+)\}\}/g, (match, styleContent) => {
    if (styleContent.includes('overflowX')) return match;
    return `className="glass-card" style={{${styleContent}, overflowX: 'auto' }}`;
  });

  // There might be containers without style tags.
  c = c.replace(/className="glass-card"(?!\s*style)/g, 'className="glass-card" style={{ overflowX: "auto" }}');

  fs.writeFileSync(f, c);
  console.log(f + ' updated overflowX');
});
