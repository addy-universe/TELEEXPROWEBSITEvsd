const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function processLogo(inputPath, outputPath, keepColors = false) {
    if (!fs.existsSync(inputPath)) {
        console.error(`[SKIPPED] '${inputPath}' not found.`);
        return false;
    }
    try {
        const img = await loadImage(inputPath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];

            // Remove white/near-white background
            if (r > 220 && g > 220 && b > 220) {
                data[i + 3] = 0; // transparent
            } else if (!keepColors && r < 80 && g < 80 && b < 80) {
                // Convert dark pixels to white (for icon on dark background)
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
            }
            // Blue and other accent colors preserved naturally
        }

        ctx.putImageData(imageData, 0, 0);
        fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
        console.log(`[OK] ${outputPath}`);
        return true;
    } catch (err) {
        console.error(`[ERROR] ${inputPath}:`, err.message);
        return false;
    }
}

async function main() {
    console.log('Processing logos...\n');
    // logo_icon: invert black→white for dark backgrounds
    await processLogo('logo_icon.jpg', 'logo_icon_transparent.png', false);
    // logo_text: keep original colors (dark navy + blue), just remove white bg
    await processLogo('logo_text.jpg', 'logo_text_transparent.png', true);
    console.log('\nDone! Refresh the browser.');
}

main();
