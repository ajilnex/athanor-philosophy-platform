const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateFavicons() {
    const logoPath = path.join(__dirname, '../public/images/logo-athanor.png');
    const appDir = path.join(__dirname, '../app');
    const publicDir = path.join(__dirname, '../public');

    // Generate apple-icon.png (180x180)
    await sharp(logoPath)
        .resize(180, 180)
        .toFile(path.join(appDir, 'apple-icon.png'));
    console.log('✅ apple-icon.png (180x180)');

    // Generate icon.png (512x512) for app/
    await sharp(logoPath)
        .resize(512, 512)
        .toFile(path.join(appDir, 'icon.png'));
    console.log('✅ icon.png (512x512)');

    // Generate favicon.ico (32x32 PNG, browsers handle it)
    await sharp(logoPath)
        .resize(32, 32)
        .toFile(path.join(appDir, 'favicon.ico'));
    console.log('✅ favicon.ico (32x32)');

    // Generate OG image (1200x630) - cropped/padded version
    const ogWidth = 1200;
    const ogHeight = 630;

    await sharp(logoPath)
        .resize(400, 400, { fit: 'inside' })
        .extend({
            top: 115,
            bottom: 115,
            left: 400,
            right: 400,
            background: { r: 253, g: 246, b: 227, alpha: 1 } // #fdf6e3
        })
        .toFile(path.join(publicDir, 'images/og-image.png'));
    console.log('✅ og-image.png (1200x630)');

    console.log('\n🎉 All favicons generated!');
}

generateFavicons().catch(console.error);
