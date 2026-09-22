import {
  isValidBarcodeValue,
  createSvgMarkup,
  renderToCanvas,
  canvasToPngBlob,
  createPdfBlob
} from "./nmb-barcode.mjs";

const form = document.querySelector("#nmb-form");
const input = document.querySelector("#nmb-value");
const error = document.querySelector("#nmb-error");
const preview = document.querySelector("#nmb-preview");
const status = document.querySelector("#nmb-status");
const copyButton = document.querySelector("#nmb-copy");
const downloadButtons = Array.from(document.querySelectorAll("[data-download]"));
const clipboardNote = document.querySelector("#nmb-clipboard-note");
const clipboardSupported = Boolean(window.ClipboardItem && navigator.clipboard?.write);
let currentValue = null;
let touched = false;

if (!clipboardSupported) {
  copyButton.disabled = true;
  copyButton.title = "Image copying is not supported by this browser";
  clipboardNote.hidden = false;
}

function setExportAvailability(enabled) {
  downloadButtons.forEach((button) => { button.disabled = !enabled; });
  copyButton.disabled = !enabled || !clipboardSupported;
}

function showPlaceholder() {
  preview.innerHTML = '<p class="nmb-placeholder">enter six digits to generate a barcode</p>';
}

function updateBarcode({ announce = false } = {}) {
  const value = input.value;
  const valid = isValidBarcodeValue(value);

  if (!valid) {
    currentValue = null;
    setExportAvailability(false);
    showPlaceholder();
    const shouldShowError = touched || value.length > 0;
    input.setAttribute("aria-invalid", shouldShowError ? "true" : "false");
    error.textContent = shouldShowError ? "Enter exactly six digits (0–9)." : "";
    status.textContent = announce && shouldShowError ? "Barcode not generated. Check the number." : "";
    return false;
  }

  currentValue = value;
  input.setAttribute("aria-invalid", "false");
  error.textContent = "";
  preview.innerHTML = createSvgMarkup(value);
  setExportAvailability(true);
  status.textContent = announce ? `Barcode ${value} generated.` : "";
  return true;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function pngBlob(value) {
  const canvas = document.createElement("canvas");
  renderToCanvas(value, canvas);
  return canvasToPngBlob(canvas);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  touched = true;
  if (!updateBarcode({ announce: true })) input.focus();
});

input.addEventListener("input", () => {
  touched = true;
  updateBarcode();
});

copyButton.addEventListener("click", async () => {
  if (!currentValue) return;
  try {
    const blob = await pngBlob(currentValue);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    status.textContent = `Copied barcode ${currentValue} as a PNG image.`;
  } catch (copyError) {
    try {
      const blob = await pngBlob(currentValue);
      downloadBlob(blob, `barcode-${currentValue}.png`);
      status.textContent = "Image copying was unavailable, so the PNG was downloaded instead.";
    } catch (downloadError) {
      status.textContent = "Could not copy the image. Use the download buttons instead.";
    }
  }
});

downloadButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!currentValue) return;
    const format = button.dataset.download;

    try {
      if (format === "png") {
        downloadBlob(await pngBlob(currentValue), `barcode-${currentValue}.png`);
      } else if (format === "svg") {
        downloadBlob(new Blob([createSvgMarkup(currentValue)], { type: "image/svg+xml;charset=utf-8" }), `barcode-${currentValue}.svg`);
      } else if (format === "pdf") {
        downloadBlob(createPdfBlob(currentValue), `barcode-${currentValue}.pdf`);
      }
      status.textContent = `Downloaded barcode-${currentValue}.${format}.`;
    } catch (downloadError) {
      status.textContent = `Could not create the ${format.toUpperCase()} file. Please try again.`;
    }
  });
});

updateBarcode();
