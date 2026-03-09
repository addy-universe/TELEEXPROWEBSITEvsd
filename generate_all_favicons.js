const fs = require('fs');
const Jimp = require('jimp');

async function createAllFavicons() {
  try {
    const sourceImage = 'logo_text_transparent.png';

    // Desktop Favicons
    await resizeImage(sourceImage, 'favicon-16x16.png', 16, 16);
    await resizeImage(sourceImage, 'favicon-32x32.png', 32, 32);

    // Apple Touch Icon (iOS)
    await resizeImage(sourceImage, 'apple-touch-icon.png', 180, 180);

    // Android Chrome Icons
    await resizeImage(sourceImage, 'android-chrome-192x192.png', 192, 192);
    await resizeImage(sourceImage, 'android-chrome-512x512.png', 512, 512);

    // Windows Tile Icon (Windows)
    await resizeImage(sourceImage, 'mstile-150x150.png', 150, 150);

    console.log('Successfully created all platform favicons!');
  } catch (error) {
    console.error('Error creating favicons:', error);
  }
}

async function resizeImage(src, dest, width, height) {
    const image = await Jimp.read(src);
    // Use crop/contain if needed, but since it's a logo, we should use contain to avoid stretching
    image.contain(width, height);
    await image.writeAsync(dest);
    console.log(`Created ${dest}`);
}

createAllFavicons();
