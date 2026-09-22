import test from "node:test";
import assert from "node:assert/strict";
import {
  MODULE_WIDTH_MM,
  MODULE_HEIGHT_MM,
  QUIET_ZONE_MM,
  isValidBarcodeValue,
  encodeCode39,
  decodeCode39,
  createBarcodeLayout,
  createSvgMarkup,
  createPdfBlob,
  renderToCanvas,
  setPngDpi
} from "../assets/js/nmb-barcode.mjs";

test("accepts only an exact six-digit value", () => {
  assert.equal(isValidBarcodeValue("000000"), true);
  assert.equal(isValidBarcodeValue("115834"), true);
  assert.equal(isValidBarcodeValue("999999"), true);
  for (const invalid of ["12345", "1234567", "12A456", ""]) {
    assert.equal(isValidBarcodeValue(invalid), false, invalid);
    assert.throws(() => encodeCode39(invalid), /exactly six digits/);
  }
});

test("115834 encodes and decodes as Code 39 with start/stop and no checksum", () => {
  const encoded = encodeCode39("115834");
  const expected = [
    "100010111011101", // start
    "111010001010111", // 1
    "111010001010111", // 1
    "111010001110101", // 5
    "111010001011101", // 8
    "111011100010101", // 3
    "101000111010111", // 4
    "100010111011101"  // stop
  ].join("0");
  assert.equal(encoded, expected);
  assert.equal(encoded.length, 127); // 8 symbols x 15 modules + 7 gaps
  assert.equal(decodeCode39(encoded), "115834");
  assert.equal(encoded.startsWith("1000101110111010"), true);
  assert.equal(encoded.endsWith("0100010111011101"), true);
});

test("layout mirrors the requested python-barcode dimensions and quiet zones", () => {
  const layout = createBarcodeLayout("115834");
  assert.equal(MODULE_WIDTH_MM, 0.4);
  assert.equal(MODULE_HEIGHT_MM, 25);
  assert.equal(QUIET_ZONE_MM, 10);
  assert.equal(layout.widthMm, 70.8);
  assert.equal(layout.heightMm, 27);
  assert.equal(layout.bars[0].x, 10);
  const lastBar = layout.bars.at(-1);
  assert.equal(Number((layout.widthMm - lastBar.x - lastBar.width).toFixed(6)), 10);
});

test("SVG contains the same vector bars without human-readable digits", () => {
  const layout = createBarcodeLayout("115834");
  const svg = createSvgMarkup("115834");
  assert.equal((svg.match(/<rect /g) || []).length, layout.bars.length + 1);
  assert.match(svg, /width="70.8mm"/);
  assert.match(svg, /height="27mm"/);
  assert.doesNotMatch(svg, />115834</);
  assert.doesNotMatch(svg, /<text/);
});

test("PNG rendering uses the same bars at 300 DPI and records that density", () => {
  const fills = [];
  const context = {
    fillStyle: "",
    fillRect: (...dimensions) => fills.push({ color: context.fillStyle, dimensions })
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  const layout = createBarcodeLayout("115834");
  renderToCanvas("115834", canvas);
  assert.deepEqual([canvas.width, canvas.height], [837, 319]);
  assert.equal(fills.length, layout.bars.length + 1);
  assert.equal(fills[0].color, "white");
  assert.equal(fills[1].color, "black");

  const minimalPng = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10,
    0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0, 73, 68, 65, 84, 0, 0, 0, 0
  ]);
  const png = setPngDpi(minimalPng);
  assert.equal(String.fromCharCode(...png.slice(37, 41)), "pHYs");
  const density = new DataView(png.buffer).getUint32(41);
  assert.equal(density, 11811);
});

test("PDF is a single vector page with one rectangle per bar", async () => {
  const layout = createBarcodeLayout("115834");
  const pdf = createPdfBlob("115834");
  const text = await pdf.text();
  assert.equal(pdf.type, "application/pdf");
  assert.match(text, /^%PDF-1\.4/);
  assert.match(text, /\/Type \/Page\b/);
  assert.equal((text.match(/ re f/g) || []).length, layout.bars.length + 1);
  assert.doesNotMatch(text, /115834/);
});
