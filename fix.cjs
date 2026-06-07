const fs = require('fs'); 
const files = ['s:/Websites/OTL-System/src/pages/Marketing.jsx', 's:/Websites/OTL-System/src/pages/AdminHub.jsx']; 

files.forEach(f => { 
  let c = fs.readFileSync(f, 'utf8'); 
  // Fix grid minmax wrapping 
  c = c.replace(/minmax\((\d+px),\s*1fr\)/g, 'minmax(min(100%, $1), 1fr)'); 
  
  // Fix inline flex containers to wrap
  c = c.replace(/style=\{\{\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'(\d+px)'\s*\}\}/g, 'style={{ display: "flex", alignItems: "center", gap: "$1", flexWrap: "wrap" }}'); 
  c = c.replace(/style=\{\{\s*display:\s*'flex',\s*gap:\s*'(\d+px)',\s*alignItems:\s*'center'\s*\}\}/g, 'style={{ display: "flex", gap: "$1", alignItems: "center", flexWrap: "wrap" }}'); 
  c = c.replace(/style=\{\{\s*display:\s*'flex',\s*gap:\s*'(\d+px)',\s*marginBottom:\s*'(\d+px)'\s*\}\}/g, 'style={{ display: "flex", gap: "$1", marginBottom: "$2", flexWrap: "wrap" }}'); 
  c = c.replace(/style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center',\s*marginBottom:\s*'(\d+px)'\s*\}\}/g, 'style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "$1", flexWrap: "wrap", gap: "15px" }}'); 
  
  // Fix the export button specifically in Marketing and AdminHub
  c = c.replace(/<div style=\{\{\s*display:\s*'flex',\s*gap:\s*'15px',\s*marginBottom:\s*'25px',\s*alignItems:\s*'center'\s*\}\}>/g, '<div style={{ display: "flex", gap: "15px", marginBottom: "25px", alignItems: "center", flexWrap: "wrap" }}>');
  
  // Replace the exact filter bar pattern
  c = c.replace(/style=\{\{\s*display:\s*'flex',\s*gap:\s*'15px',\s*alignItems:\s*'center',\s*background:\s*'rgba\(255,255,255,0\.02\)',\s*padding:\s*'15px',\s*borderRadius:\s*'12px',\s*border:\s*'1px solid var\(--border\)'\s*\}\}/g, 'style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap", background: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "12px", border: "1px solid var(--border)" }}');

  fs.writeFileSync(f, c); 
  console.log(f + ' fixed.'); 
});
