const fs = require('fs').promises;
const path = require('path');

(async () => {
  try {
    const sources = [
      "C:\\Users\\kovidh\\Desktop\\k\\001.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\1.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\1a052ad2-34d9-4e06-a8d5-2a9061243f9f.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\002.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\2.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\2f26c391-e66e-46b8-9b4a-c59b0b7265e3.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\003.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\004.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\4.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\4d23da30-4f91-41fb-b3df-e2e03f3b0911.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\5.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\006.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\6c92093d-9e60-467d-b5c3-bd8925710895.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\007.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\7.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\7a8e2a28-8851-459d-9117-89ff299f3312.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\7d4b34f8-9d6f-4268-9962-7442e386e535.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\008.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\8.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\8d0968dc-e4fc-483e-860d-8aeb533297fd.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\009.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\9.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\9ada0424-e0ba-4f06-b2db-e8a9959d76ea.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\9dfa0473-435d-410d-a40a-eeb8f6f62802.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\10.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\11.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\17f9362a-1132-4a2d-baf9-6b0f3426060b.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\23d2f6c7-8265-41f4-80f3-b52aa75277df.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\32da59b1-c6eb-47f3-98fe-2b2a87d0ef65.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\60e92f7d-7ca8-43c9-9c0b-ed6d119675da.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\64fa81f8-dcf8-4deb-8fe8-4fd4f0503fc1.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\86d14489-e7b5-486d-8b02-8aa4ee2e512c.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\100.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\101.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\102.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\103.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\104.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\105.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\106.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\107.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\110.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\111.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\112.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\115.mp4",
      "C:\\Users\\kovidh\\Desktop\\k\\478d2e6a-641a-4c15-ba70-3b18346357de.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\780f0984-845d-41f8-8eb9-042df64121ae.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\929fb735-a82f-4e78-adbc-6ca6e6bcc602.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\8753206c-86bf-4aa1-8309-633d952d7f0e.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\a7f048da-da0a-41a9-8a72-065387e678d4.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\a59f446f-a6ef-49a9-bc00-a6fb9ba650bb.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\a7077c7e-22dd-473a-9507-d7b89ed88d77.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\b9c83978-89fb-4129-972d-a7e5089505d0.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\bba92322-538a-4a8b-ac55-9f1d65d83a41.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\bcd67bb5-f24f-4aae-bc7b-051d1e4a2247.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\c0363a95-aa23-4c63-afe4-5b4bdbab6306.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\d3d5bb97-6391-47e5-87e0-1df8d628df85.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\de1f5b5d-5f8c-45f0-a919-8a458e287ee1.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\e5b8fd7a-b087-4bf7-8651-a53be220affc.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\e16bd21d-727e-4c6a-b899-c3c2f8069791.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\e752eb37-f790-4366-946d-e3ab714db632.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\e7172d8b-40eb-430b-9932-13a5847ce7cf.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\f0b0d1a3-6c84-4ecb-bd00-5ce7806303b0.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\f20acf77-fbd1-4ac8-b318-e97c03e350ba.jpg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2025-11-19 at 2.56.48 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2025-11-19 at 2.56.49 PM (1).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2025-11-19 at 2.56.49 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2025-11-19 at 2.56.50 PM (1).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2025-11-19 at 2.56.50 PM (2).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2025-11-19 at 2.56.50 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2025-11-19 at 2.56.51 PM (1).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2025-11-19 at 2.56.51 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 1.05.38 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.30 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.32 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (1).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (2).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (3).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (4).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (5).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (6).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (7).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (8).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (9).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (10).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (11).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (12).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (13).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (14).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (15).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (16).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (17).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (18).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (19).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (20).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (21).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (22).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM (23).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.32.33 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.45.27 PM (1).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.45.27 PM (2).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.45.27 PM (3).jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Image 2026-02-22 at 6.45.27 PM.jpeg",
      "C:\\Users\\kovidh\\Desktop\\k\\WhatsApp Video 2026-02-22 at 6.17.01 PM.mp4"
    ];

    const destDir = path.resolve(process.cwd(), 'public', 'gallery-images');

    // ensure destination exists
    await fs.mkdir(destDir, { recursive: true });

    const basenames = sources.map(s => path.basename(s));
    const basenameSet = new Set(basenames);

    // copy each source (overwrites if exists)
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const base = basenames[i];
      try {
        await fs.copyFile(src, path.join(destDir, base));
        console.log(`Copied: ${base}`);
      } catch (err) {
        console.warn(`Failed to copy ${src} -> ${base}:`, err && err.message ? err.message : err);
      }
    }

    // remove files in dest not in the provided list
    const destFiles = await fs.readdir(destDir);
    for (const f of destFiles) {
      if (!basenameSet.has(f)) {
        try {
          await fs.unlink(path.join(destDir, f));
          console.log(`Removed old file: ${f}`);
        } catch (err) {
          console.warn(`Failed to remove ${f}:`, err && err.message ? err.message : err);
        }
      }
    }

    console.log('Gallery sync complete.');
  } catch (err) {
    console.error('Error during gallery sync:', err);
    process.exit(1);
  }
})();
