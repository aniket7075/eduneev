const fs = require('fs');
const path = require('path');

const fixCatchBlocks = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/catch\s*\(\s*_?e\s*\)/g, 'catch');
  content = content.replace(/catch\s*\(\s*_?err\s*\)/g, 'catch');
  fs.writeFileSync(filePath, content, 'utf-8');
};

const filesToFix = [
  'src/pages/admin/ChatPortal.tsx',
  'src/pages/admin/StaffDirectory.tsx',
  'src/pages/admin/StudentsDirectory.tsx',
  'src/pages/admin/EnquiriesManagement.tsx',
  'src/pages/admin/FeesManagement.tsx'
];

filesToFix.forEach(f => {
  const fullPath = path.join(__dirname, f);
  if (fs.existsSync(fullPath)) {
    fixCatchBlocks(fullPath);
    console.log(`Fixed catch blocks in ${f}`);
  }
});
