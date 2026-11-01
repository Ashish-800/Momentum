// scripts/crop-brand-assets.js
// Extracts exact pixel artwork from the uploaded Momentum brand sheet

import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_PATH = fs.existsSync("public/brand-sheet.jpg")
  ? "public/brand-sheet.jpg"
  : "C:/Users/Ashish/.gemini/antigravity/brain/198992bd-30f3-4efd-b177-ae696174cf47/.user_uploaded/media_1793540978074_95704983.jpg";

async function main() {
  console.log("Using source brand sheet:", SOURCE_PATH);

  if (!fs.existsSync("public")) {
    fs.mkdirSync("public", { recursive: true });
  }

  // Ensure public/brand-sheet.jpg is in place
  if (SOURCE_PATH !== "public/brand-sheet.jpg") {
    fs.copyFileSync(SOURCE_PATH, "public/brand-sheet.jpg");
  }

  const meta = await sharp(SOURCE_PATH).metadata();
  console.log("Brand Sheet resolution:", meta.width, "x", meta.height);

  // 1. Favicon / Sidebar Squircle Icon (public/momentum-icon.png)
  // Coordinates: left: 816, top: 202, width: 154, height: 150
  await sharp(SOURCE_PATH)
    .extract({ left: 816, top: 202, width: 154, height: 150 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile("public/momentum-icon.png");
  console.log("✓ Created public/momentum-icon.png (154x150)");

  // 2. Standalone 'M' Symbol (public/momentum-mark.png)
  // Coordinates: left: 82, top: 220, width: 215, height: 125
  await sharp(SOURCE_PATH)
    .extract({ left: 82, top: 220, width: 215, height: 125 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile("public/momentum-mark.png");
  console.log("✓ Created public/momentum-mark.png (215x125)");

  // 3. Full Horizontal Logo (public/momentum-full.png)
  // Coordinates: left: 82, top: 220, width: 620, height: 125
  await sharp(SOURCE_PATH)
    .extract({ left: 82, top: 220, width: 620, height: 125 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile("public/momentum-full.png");
  console.log("✓ Created public/momentum-full.png (620x125)");

  // Also create a 32x32 and 192x192 favicon versions for browser tabs
  await sharp("public/momentum-icon.png")
    .resize(32, 32, { fit: "contain" })
    .toFile("public/favicon-32x32.png");
  console.log("✓ Created public/favicon-32x32.png");
}

main().catch((err) => {
  console.error("Error cropping assets:", err);
  process.exit(1);
});

