// Code 39 encoding and dependency-free SVG/PDF export.
// Dimensions mirror the supplied python-barcode writer options.

export const MODULE_WIDTH_MM = 0.4;
export const MODULE_HEIGHT_MM = 25;
export const QUIET_ZONE_MM = 10;
export const MARGIN_TOP_MM = 1;
export const MARGIN_BOTTOM_MM = 1;
export const PNG_DPI = 300;

const EDGE = "100010111011101";
const GAP = "0";
const DIGIT_PATTERNS = Object.freeze({
  "0": "101000111011101",
  "1": "111010001010111",
  "2": "101110001010111",
  "3": "111011100010101",
  "4": "101000111010111",
  "5": "111010001110101",
  "6": "101110001110101",
  "7": "101000101110111",
  "8": "111010001011101",
  "9": "101110001011101"
});

const REVERSE_PATTERNS = new Map([
  [EDGE, "*"],
  ...Object.entries(DIGIT_PATTERNS).map(([digit, pattern]) => [pattern, digit])
]);

export function isValidBarcodeValue(value) {
  return /^[0-9]{6}$/.test(String(value));
}

export function encodeCode39(value) {
  const text = String(value);
  if (!isValidBarcodeValue(text)) {
    throw new TypeError("Barcode value must contain exactly six digits.");
  }

  // EDGE is the Code 39 start/stop symbol. No Mod-43 character is inserted.
  return [EDGE, ...text.split("").map((digit) => DIGIT_PATTERNS[digit]), EDGE].join(GAP);
}

export function decodeCode39(modules) {
  const symbols = [];
  let offset = 0;

  while (offset < modules.length) {
    const pattern = modules.slice(offset, offset + 15);
    const symbol = REVERSE_PATTERNS.get(pattern);
    if (!symbol) throw new TypeError("Invalid Code 39 module pattern.");
    symbols.push(symbol);
    offset += 15;
    if (offset < modules.length) {
      if (modules[offset] !== GAP) throw new TypeError("Invalid Code 39 character gap.");
      offset += 1;
    }
  }

  if (symbols.length < 2 || symbols[0] !== "*" || symbols.at(-1) !== "*") {
    throw new TypeError("Code 39 start/stop symbols are missing.");
  }
  return symbols.slice(1, -1).join("");
}

export function createBarcodeLayout(value) {
  const modules = encodeCode39(value);
  const widthMm = Number((QUIET_ZONE_MM * 2 + modules.length * MODULE_WIDTH_MM).toFixed(3));
  const heightMm = MARGIN_TOP_MM + MODULE_HEIGHT_MM + MARGIN_BOTTOM_MM;
  const bars = [];

  for (let index = 0; index < modules.length;) {
    if (modules[index] === "0") {
      index += 1;
      continue;
    }
    const start = index;
    while (modules[index] === "1") index += 1;
    bars.push({
      x: QUIET_ZONE_MM + start * MODULE_WIDTH_MM,
      y: MARGIN_TOP_MM,
      width: (index - start) * MODULE_WIDTH_MM,
      height: MODULE_HEIGHT_MM
    });
  }

  return { value: String(value), modules, widthMm, heightMm, bars };
}

function decimal(value) {
  return Number(value.toFixed(3)).toString();
}

export function createSvgMarkup(value) {
  const layout = createBarcodeLayout(value);
  const bars = layout.bars.map((bar) =>
    `  <rect x="${decimal(bar.x)}" y="${decimal(bar.y)}" width="${decimal(bar.width)}" height="${decimal(bar.height)}"/>`
  ).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${decimal(layout.widthMm)}mm" height="${decimal(layout.heightMm)}mm" viewBox="0 0 ${decimal(layout.widthMm)} ${decimal(layout.heightMm)}" role="img" aria-label="Code 39 barcode" shape-rendering="crispEdges">`,
    `  <rect width="${decimal(layout.widthMm)}" height="${decimal(layout.heightMm)}" fill="white"/>`,
    '  <g fill="black">',
    bars,
    "  </g>",
    "</svg>"
  ].join("\n");
}

export function renderToCanvas(value, canvas, dpi = PNG_DPI) {
  const layout = createBarcodeLayout(value);
  const pxPerMm = dpi / 25.4;
  canvas.width = Math.ceil(layout.widthMm * pxPerMm);
  canvas.height = Math.ceil(layout.heightMm * pxPerMm);

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas rendering is unavailable.");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "black";
  layout.bars.forEach((bar) => {
    context.fillRect(
      bar.x * pxPerMm,
      bar.y * pxPerMm,
      bar.width * pxPerMm,
      bar.height * pxPerMm
    );
  });
  return canvas;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngDensityChunk(dpi) {
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  view.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4); // pHYs
  view.setUint32(8, pixelsPerMeter);
  view.setUint32(12, pixelsPerMeter);
  chunk[16] = 1; // unit is metres
  view.setUint32(17, crc32(chunk.slice(4, 17)));
  return chunk;
}

export function setPngDpi(pngBytes, dpi = PNG_DPI) {
  const bytes = pngBytes instanceof Uint8Array ? pngBytes : new Uint8Array(pngBytes);
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33 || !signature.every((byte, index) => bytes[index] === byte)) {
    throw new TypeError("Invalid PNG data.");
  }

  let offset = 8;
  let replaceStart = -1;
  let replaceEnd = -1;
  let insertAt = bytes.length;
  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const length = view.getUint32(0);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new TypeError("Invalid PNG chunk length.");
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    if (type === "pHYs") {
      replaceStart = offset;
      replaceEnd = end;
      break;
    }
    if (type === "IDAT") {
      insertAt = offset;
      break;
    }
    offset = end;
  }

  const chunk = pngDensityChunk(dpi);
  const start = replaceStart >= 0 ? replaceStart : insertAt;
  const end = replaceEnd >= 0 ? replaceEnd : insertAt;
  const output = new Uint8Array(bytes.length - (end - start) + chunk.length);
  output.set(bytes.slice(0, start));
  output.set(chunk, start);
  output.set(bytes.slice(end), start + chunk.length);
  return output;
}

export function canvasToPngBlob(canvas, dpi = PNG_DPI) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG creation failed."));
        return;
      }
      blob.arrayBuffer()
        .then((buffer) => resolve(new Blob([setPngDpi(buffer, dpi)], { type: "image/png" })))
        .catch(reject);
    }, "image/png");
  });
}

function mmToPoints(mm) {
  return mm * 72 / 25.4;
}

export function createPdfBlob(value) {
  const layout = createBarcodeLayout(value);
  const pageWidth = mmToPoints(layout.widthMm);
  const pageHeight = mmToPoints(layout.heightMm);
  const commands = [
    "1 1 1 rg",
    `0 0 ${decimal(pageWidth)} ${decimal(pageHeight)} re f`,
    "0 0 0 rg",
    ...layout.bars.map((bar) => [
      decimal(mmToPoints(bar.x)),
      decimal(mmToPoints(MARGIN_BOTTOM_MM)),
      decimal(mmToPoints(bar.width)),
      decimal(mmToPoints(bar.height)),
      "re f"
    ].join(" "))
  ].join("\n") + "\n";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${decimal(pageWidth)} ${decimal(pageHeight)}] /Resources << >> /Contents 4 0 R >>`,
    `<< /Length ${commands.length} >>\nstream\n${commands}endstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([pdf], { type: "application/pdf" });
}
