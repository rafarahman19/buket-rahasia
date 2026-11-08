import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./bouquet-catalog";

/**
 * Renders a self-contained `<svg>` DOM element into a crisp PNG `Blob`
 * sized under 500 KB using native SVG serialization + HTML5 `<canvas>.toBlob`.
 */
export async function exportSvgElementToPngBlob(
  svgElement: SVGSVGElement
): Promise<Blob> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Strip interactive editor selection overlays before exporting preview PNG
  const editorOnlyNodes = clone.querySelectorAll("[data-editor-overlay='true']");
  editorOnlyNodes.forEach((node) => node.remove());

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(CANVAS_WIDTH));
  clone.setAttribute("height", String(CANVAS_HEIGHT));
  clone.setAttribute("viewBox", `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);

  const serializedSvg = new XMLSerializer().serializeToString(clone);
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serializedSvg)}`;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal merender pratinjau buket."));
    image.src = svgDataUrl;
  });

  // Render at 480x544 so the resulting PNG stays sharp in email clients while
  // reliably staying far below the 500 KB server limit (typically 35–95 KB).
  const targetWidth = 480;
  const targetHeight = Math.round((CANVAS_HEIGHT / CANVAS_WIDTH) * targetWidth);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Browser tidak mendukung kanvas gambar.");
  }

  // Warm cream background so email clients in dark mode don't clash with pastel petals
  ctx.fillStyle = "#FFFBF7";
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Gagal membuat file PNG buket."));
          return;
        }
        resolve(result);
      },
      "image/png",
      0.92
    );
  });

  return blob;
}
