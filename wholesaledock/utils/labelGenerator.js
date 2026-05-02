const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Generate box label as SVG (no canvas dependency needed)
const generateBoxLabel = async (sku, productName, ctnQty) => {
  const uploadsDir = path.join(__dirname, '../uploads/labels');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `label_${uuidv4()}.svg`;
  const filepath = path.join(uploadsDir, filename);

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="200" fill="white" stroke="#000" stroke-width="2"/>
  <rect x="10" y="10" width="380" height="180" fill="white" stroke="#333" stroke-width="1"/>
  <line x1="10" y1="80" x2="390" y2="80" stroke="#333" stroke-width="1"/>
  <line x1="10" y1="140" x2="390" y2="140" stroke="#333" stroke-width="1"/>
  <text x="200" y="52" font-family="Arial, sans-serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#000">${escapeXml(sku)}</text>
  <text x="200" y="116" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#333">${escapeXml(productName)}</text>
  <text x="200" y="170" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#555">CTN QTY: ${escapeXml(String(ctnQty || 'N/A'))}</text>
</svg>`;

  fs.writeFileSync(filepath, svgContent);
  return `/uploads/labels/${filename}`;
};

const escapeXml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

module.exports = { generateBoxLabel };
