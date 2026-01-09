import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'fragrances_filtered.json');
const raw = fs.readFileSync(dataPath, 'utf-8');
const fragrances = JSON.parse(raw);

const normalize = (str) => {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const usedIds = new Set();

const updatedFragrances = fragrances.map((f, index) => {
  let baseId = `${normalize(f.Brand || 'unknown')}-${normalize(f.Name || 'unknown')}`;
  let id = baseId;
  let counter = 1;
  
  while (usedIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }
  
  usedIds.add(id);
  return { id, ...f };
});

fs.writeFileSync(dataPath, JSON.stringify(updatedFragrances, null, 2));
console.log(`Successfully assigned unique IDs to ${updatedFragrances.length} fragrances.`);


