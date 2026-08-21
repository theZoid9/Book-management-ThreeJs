/* ================================================================
   FALLBACK COVER GENERATOR
   Draws a stylised book cover on a canvas when the image file
   fails to load from disk.
   ================================================================ */

export function createFallbackCover(title, author) {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 450;
    const ctx = c.getContext('2d');

    // Background gradient
    const g = ctx.createLinearGradient(0, 0, 300, 450);
    g.addColorStop(0, '#1a1520');
    g.addColorStop(1, '#0c0a12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 300, 450);

    // Decorative borders
    ctx.strokeStyle = 'rgba(201,148,74,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 268, 418);

    ctx.strokeStyle = 'rgba(201,148,74,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, 256, 406);

    // Title
    ctx.fillStyle = '#ede4d3';
    ctx.font = 'bold 24px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    wrapText(ctx, title, 150, 200, 250, 32);

    // Divider
    ctx.strokeStyle = 'rgba(201,148,74,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 300);
    ctx.lineTo(220, 300);
    ctx.stroke();

    // Author
    ctx.fillStyle = '#c9944a';
    ctx.font = '16px "DM Sans", sans-serif';
    ctx.fillText(author, 150, 340);

    return c;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), x, currentY);
            line = word + ' ';
            currentY += lineHeight;
        } else {
            line = test;
        }
    }
    ctx.fillText(line.trim(), x, currentY);
}