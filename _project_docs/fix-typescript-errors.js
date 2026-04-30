const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/services/api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all withTimeout calls by adding type assertion
content = content.replace(
  /const \{ (data|error|data, error) \} = await withTimeout\(/g,
  'const response = await withTimeout('
);

// Add destructuring after the call
content = content.replace(
  /const response = await withTimeout\(([\s\S]*?)\);(\s+)if \(error\)/g,
  (match, promise, whitespace) => {
    return `const response = await withTimeout(${promise});${whitespace}const { data, error } = response as any;${whitespace}if (error)`;
  }
);

// Fix cases where only error is destructured
content = content.replace(
  /const \{ error \} = await withTimeout\(/g,
  'const response = await withTimeout('
);

content = content.replace(
  /const response = await withTimeout\(([\s\S]*?)\);(\s+)if \(error\) throw error;/g,
  (match, promise, whitespace) => {
    return `const response = await withTimeout(${promise});${whitespace}const { error } = response as any;${whitespace}if (error) throw error;`;
  }
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all TypeScript errors in api.ts');
