const fs = require('fs');
let code = fs.readFileSync('src/services/api.ts', 'utf8');

const queries = [
  "const { data, error } = await (supabase as any)\\s*\\.from\\('profiles'\\)\\s*\\.select\\('\\*'\\)\\s*\\.order\\('created_at', \\{ ascending: false \\}\\);",
  "const { data, error } = await (supabase as any)\\s*\\.from\\('products'\\)\\s*\\.select\\('\\*'\\)\\s*\\.order\\('created_at', \\{ ascending: false \\}\\);",
  "const { data, error } = await (supabase as any)\\s*\\.from\\('orders'\\)\\s*\\.select\\('\\*'\\)\\s*\\.order\\('created_at', \\{ ascending: false \\}\\);",
  "const { data, error } = await (supabase as any)\\s*\\.from\\('categories'\\)\\s*\\.select\\('\\*'\\)\\s*\\.order\\('order', \\{ ascending: true \\}\\);"
];

const replacements = [
  "const { data, error } = await withTimeout((supabase as any).from('profiles').select('*').order('created_at', { ascending: false }));",
  "const { data, error } = await withTimeout((supabase as any).from('products').select('*').order('created_at', { ascending: false }));",
  "const { data, error } = await withTimeout((supabase as any).from('orders').select('*').order('created_at', { ascending: false }));",
  "const { data, error } = await withTimeout((supabase as any).from('categories').select('*').order('order', { ascending: true }));"
];

for (let i = 0; i < queries.length; i++) {
  code = code.replace(new RegExp(queries[i], 'g'), replacements[i]);
}

fs.writeFileSync('src/services/api.ts', code);
console.log('Patched api.ts successfully.');
