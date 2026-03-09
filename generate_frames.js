const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const framesDir = path.join(__dirname, 'frames');
if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir);
}

const numFrames = 120; // 4 seconds at 30fps
const width = 1920;
const height = 1080;

// Create canvas
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

console.log(`Generating ${numFrames} placeholder frames...`);

for (let i = 1; i <= numFrames; i++) {
    // Clear canvas
    ctx.fillStyle = '#020C1B'; // Base background
    ctx.fillRect(0, 0, width, height);

    // Calculate animation progress (0 to 1)
    const progress = i / numFrames;

    // Draw some moving shapes to simulate complex 3D animation

    // Background glow that changes intensity based on progress
    const glowIntensity = Math.abs(Math.sin(progress * Math.PI * 4)); // Pulse twice per loop
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, `rgba(0, 240, 255, ${0.1 + glowIntensity * 0.1})`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Stepping man box (represents the businessman)
    // Moves from bottom left to top right
    const manX = 300 + (progress * (width - 600));
    const manY = 800 - (progress * 400); // Moves up

    // Bobbing motion for walking
    const bob = Math.sin(progress * Math.PI * 12) * 20;

    // "Businessman in emerald green suit" placeholder
    ctx.fillStyle = '#00E676';
    ctx.beginPath();
    ctx.roundRect(manX - 50, manY - 150 + bob, 100, 300, 20);
    ctx.fill();

    // "Glowing blue glass steps"
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 10;

    // Draw 3 visible steps around the man
    for (let j = 0; j < 5; j++) {
        const stepOffset = ((progress * 10) % 1) * 100; // Continuous motion
        const baseX = manX - 300 + (j * 150) - stepOffset;
        const baseY = manY + 150 - (j * 100) + stepOffset;

        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX + 250, baseY);
        ctx.lineTo(baseX + 300, baseY + 30);
        ctx.lineTo(baseX + 50, baseY + 30);
        ctx.closePath();

        // Fill glass effect
        ctx.fillStyle = `rgba(0, 240, 255, ${0.1 + (j * 0.05)})`;
        ctx.fill();
        ctx.stroke();
    }

    // Add frame number text overlay
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px sans-serif';
    ctx.fillText(`Frame ${i}/${numFrames}`, 50, 100);

    // Save frame
    const paddedIndex = String(i).padStart(3, '0');
    const fileName = `frame_${paddedIndex}.jpg`;
    const filePath = path.join(framesDir, fileName);

    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.8 });
    fs.writeFileSync(filePath, buffer);

    if (i % 10 === 0) {
        process.stdout.write(`...${i}`);
    }
}

console.log(`\n\nDone! Generated ${numFrames} frames in ./frames`);
