import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PRINT_DPI, PAPER_SIZES, calculateCardPosition, mmToPx } from '../print/printSettings.js';
import { calculateLayoutFromPrintSettings } from '../print/calculateA4Layout.js';

function createCaptureClone(element) {
  const clone = element.cloneNode(true);
  const sourceCanvases = element.querySelectorAll('canvas');
  clone.querySelectorAll('canvas').forEach((canvas, index) => {
    const image = document.createElement('img');
    image.src = sourceCanvases[index].toDataURL('image/png');
    image.hidden = canvas.hidden;
    image.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:0';
    canvas.replaceWith(image);
  });
  Object.assign(clone.style, { position: 'fixed', left: '-10000px', top: '0', width: '390px', height: 'auto', transform: 'none', margin: '0', zIndex: '-1' });
  document.body.append(clone);
  return clone;
}

async function capturePlate(element) {
  const clone = createCaptureClone(element);
  try {
    return await html2canvas(clone, { scale: 4, backgroundColor: null, useCORS: true, logging: false });
  } finally {
    clone.remove();
  }
}

export async function renderCardAtPrintSize(element, widthMm, heightMm, dpi = PRINT_DPI) {
  const source = await capturePlate(element);
  const canvas = document.createElement('canvas');
  canvas.width = mmToPx(widthMm, dpi);
  canvas.height = mmToPx(heightMm, dpi);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  const ratio = Math.min(canvas.width / source.width, canvas.height / source.height);
  const drawWidth = Math.round(source.width * ratio);
  const drawHeight = Math.round(source.height * ratio);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, Math.round((canvas.width - drawWidth) / 2), Math.round((canvas.height - drawHeight) / 2), drawWidth, drawHeight);
  return canvas;
}

function rotateCanvas90(source) {
  const canvas = document.createElement('canvas');
  canvas.width = source.height;
  canvas.height = source.width;
  const context = canvas.getContext('2d');
  context.translate(canvas.width, 0);
  context.rotate(Math.PI / 2);
  context.drawImage(source, 0, 0);
  return canvas;
}

function drawCanvasCutLine(context, canvas, settings, dpi) {
  const strokePx = Math.max(1, mmToPx(0.25, dpi));
  context.strokeStyle = settings.color || '#555555';
  context.lineWidth = strokePx;
  if (settings.style === 'dotted') context.setLineDash([strokePx, strokePx * 2]);
  else if (settings.style === 'dashed') context.setLineDash([strokePx * 6, strokePx * 4]);
  else context.setLineDash([]);
  context.strokeRect(strokePx / 2, strokePx / 2, canvas.width - strokePx, canvas.height - strokePx);
}

async function renderStandaloneCard(element, settings, dpi = PRINT_DPI) {
  const position = calculateCardPosition(settings);
  const art = await renderCardAtPrintSize(element, position.widthMm, position.heightMm, dpi);
  const cut = settings.cutLineSettings;
  if (!cut?.enabled) return { canvas: art, widthMm: position.widthMm, heightMm: position.heightMm };
  const offsetPx = mmToPx(cut.offsetMm, dpi);
  const canvas = document.createElement('canvas');
  canvas.width = art.width + offsetPx * 2;
  canvas.height = art.height + offsetPx * 2;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(art, offsetPx, offsetPx);
  drawCanvasCutLine(context, canvas, cut, dpi);
  return { canvas, widthMm: position.widthMm + cut.offsetMm * 2, heightMm: position.heightMm + cut.offsetMm * 2 };
}

export async function downloadPng(element, settings = { cardWidthMm: 100, cardHeightMm: 150, orientation: 'portrait', marginMm: 5 }) {
  const { canvas, widthMm, heightMm } = await renderStandaloneCard(element, settings);
  const link = document.createElement('a');
  link.download = `placa-pix-${widthMm}x${heightMm}mm.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function downloadPdf(element, settings) {
  const { canvas, widthMm, heightMm } = await renderStandaloneCard(element, settings);
  const pdf = new jsPDF({ orientation: widthMm > heightMm ? 'landscape' : 'portrait', unit: 'mm', format: [widthMm, heightMm] });
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');
  pdf.save(`placa-pix-${widthMm}x${heightMm}mm.pdf`);
}

function applyPdfLineStyle(pdf, settings) {
  pdf.setDrawColor(settings.color || '#555555');
  pdf.setLineWidth(0.25);
  if (settings.style === 'dotted') pdf.setLineDashPattern([0.35, 0.7], 0);
  else if (settings.style === 'dashed') pdf.setLineDashPattern([2, 1.5], 0);
  else pdf.setLineDashPattern([], 0);
}

function addCutLine(pdf, position, settings) {
  applyPdfLineStyle(pdf, settings);
  pdf.rect(position.cutLineXmm, position.cutLineYmm, position.cutLineWidthMm, position.cutLineHeightMm);
  pdf.setLineDashPattern([], 0);
}

function addCropMarks(pdf, position, gapMm = 5) {
  const { xMm: x, yMm: y, widthMm: width, heightMm: height } = position;
  const gap = Math.min(1, gapMm / 4);
  const length = Math.min(3, Math.max(0.5, gapMm / 2 - gap));
  pdf.setDrawColor(25, 25, 25);
  pdf.setLineWidth(0.15);
  [[x, y], [x + width, y], [x, y + height], [x + width, y + height]].forEach(([cornerX, cornerY], index) => {
    const left = index % 2 === 0;
    const top = index < 2;
    pdf.line(cornerX + (left ? -gap : gap), cornerY, cornerX + (left ? -(gap + length) : gap + length), cornerY);
    pdf.line(cornerX, cornerY + (top ? -gap : gap), cornerX, cornerY + (top ? -(gap + length) : gap + length));
  });
}

export async function createA4Pdf(element, settings) {
  const paper = PAPER_SIZES.a4;
  const layout = calculateLayoutFromPrintSettings(settings, paper);
  if (!layout.itemsPerPage) throw new Error('Nenhuma placa cabe na folha A4.');
  const firstItem = layout.pages[0].positions[0];
  const baseWidthMm = firstItem.rotation ? firstItem.heightMm : firstItem.widthMm;
  const baseHeightMm = firstItem.rotation ? firstItem.widthMm : firstItem.heightMm;
  let canvas = await renderCardAtPrintSize(element, baseWidthMm, baseHeightMm);
  if (firstItem.rotation === 90) canvas = rotateCanvas90(canvas);
  const image = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [paper.widthMm, paper.heightMm] });
  layout.pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) pdf.addPage([paper.widthMm, paper.heightMm], 'portrait');
    page.positions.forEach((position) => {
      pdf.addImage(image, 'PNG', position.xMm, position.yMm, position.widthMm, position.heightMm, undefined, 'FAST');
      if (settings.cutLineSettings?.enabled) addCutLine(pdf, position, settings.cutLineSettings);
      const markPosition = settings.cutLineSettings?.enabled ? { ...position, xMm: position.cutLineXmm, yMm: position.cutLineYmm, widthMm: position.cutLineWidthMm, heightMm: position.cutLineHeightMm } : position;
      if (settings.showCropMarks) addCropMarks(pdf, markPosition, settings.gapMm);
    });
  });
  return pdf;
}

export async function downloadA4Pdf(element, settings) {
  const pdf = await createA4Pdf(element, settings);
  pdf.save('placa-pix-folha-a4.pdf');
}

export async function printA4(element, settings, targetWindow = null) {
  const pdf = await createA4Pdf(element, settings);
  const pdfUrl = pdf.output('bloburl');
  if (targetWindow) targetWindow.location.href = pdfUrl;
  else window.open(pdfUrl, '_blank', 'noopener,noreferrer');
}
