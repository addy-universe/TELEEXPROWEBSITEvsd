const fs = require('fs');
const Jimp = require('jimp');

async function createFavicon() {
  try {
    // Read the source image
    const image = await Jimp.read('logo_text_transparent.png');
    
    // Resize down or up to 48x48 (standard favicon size)
    image.resize(48, 48);
    
    // Get the raw PNG output
    const pngBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    
    // Create the 22-byte ICO header for a single image
    const size = 48;
    const header = Buffer.alloc(22);
    // idReserved (0)
    header.writeUInt16LE(0, 0);
    // idType (1 for ICO)
    header.writeUInt16LE(1, 2);
    // idCount (1 image)
    header.writeUInt16LE(1, 4);
    
    // Image content description block (16 bytes)
    header.writeUInt8(size, 6); // bWidth
    header.writeUInt8(size, 7); // bHeight
    header.writeUInt8(0, 8); // bColorCount (0 indicates no palette limits)
    header.writeUInt8(0, 9); // bReserved
    header.writeUInt16LE(1, 10); // wPlanes (always 1)
    header.writeUInt16LE(32, 12); // wBitCount (we use 32 bit so transparency works well)
    // dwBytesInRes (size of the image data)
    header.writeUInt32LE(pngBuffer.length, 14);
    // dwImageOffset (where the image data starts, which is after this header)
    header.writeUInt32LE(22, 18);
    
    // Combine header and the PNG data into an ICO
    const icoBuffer = Buffer.concat([header, pngBuffer]);
    
    // Write out the valid favicon
    fs.writeFileSync('favicon.ico', icoBuffer);
    console.log('Successfully created 48x48 favicon.ico');
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}

createFavicon();
