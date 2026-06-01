export interface BifImage {
  timeMs: number;
  offset: number;
  length: number;
}

export interface BifData {
  images: BifImage[];
  buffer: ArrayBuffer;
}

export async function parseBifUrl(url: string): Promise<BifData | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return parseBifBuffer(buffer);
  } catch (err) {
    console.warn('Failed to fetch/parse BIF:', err);
    return null;
  }
}

export function parseBifBuffer(buffer: ArrayBuffer): BifData | null {
  const view = new DataView(buffer);

  // 1. Magic Number '89 42 49 46 0D 0A 1A 0A'
  if (view.getUint32(0, true) !== 0x46494289 || view.getUint32(4, true) !== 0x0A1A0A0D) {
    console.warn('Invalid BIF magic number');
    return null;
  }

  // 2. Version (4 bytes) - Ignore

  // 3. Image count (4 bytes)
  const imageCount = view.getUint32(12, true);

  // 4. Framewise multiplier (4 bytes, in milliseconds)
  const multiplier = view.getUint32(16, true);

  const images: BifImage[] = [];

  // Index starts at byte 64
  let indexOffset = 64;
  for (let i = 0; i < imageCount; i++) {
    const timestampMult = view.getUint32(indexOffset, true);
    const imageOffset = view.getUint32(indexOffset + 4, true);

    // Next image offset to calculate length
    const nextImageOffset = view.getUint32(indexOffset + 8 + 4, true);
    const length = nextImageOffset - imageOffset;

    // Default multiplier is 1000ms if not specified or 0
    const timeMs = timestampMult * (multiplier === 0 ? 1000 : multiplier);

    if (length > 0) {
      images.push({
        timeMs,
        offset: imageOffset,
        length,
      });
    }
    indexOffset += 8;
  }

  return { images, buffer };
}

export function getBifImageBlobUrl(bif: BifData, timeMs: number): string | null {
  if (!bif || !bif.images.length) return null;

  // Find closest image
  let closest = bif.images[0];
  for (const img of bif.images) {
    if (img.timeMs <= timeMs) {
      closest = img;
    } else {
      break;
    }
  }

  if (!closest) return null;

  const slice = new Uint8Array(bif.buffer, closest.offset, closest.length);
  const blob = new Blob([slice], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
}
