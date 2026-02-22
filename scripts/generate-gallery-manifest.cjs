const fs = require('fs').promises;
const path = require('path');

(async () => {
  try {
    const dir = path.resolve(process.cwd(), 'public', 'gallery-images');
    const out = path.join(dir, 'manifest.json');

    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries
      .filter(e => e.isFile())
      .map(e => e.name)
      .filter(name => /\.(jpe?g|png|webp|mp4|mov)$/i.test(name))
      .sort();

    await fs.writeFile(out, JSON.stringify(files, null, 2), 'utf8');
    console.log(`Wrote ${files.length} entries to ${out}`);
  } catch (err) {
    console.error('Failed to generate manifest:', err);
    process.exit(1);
  }
})();
